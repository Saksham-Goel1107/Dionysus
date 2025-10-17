import { pullCommits } from '@/lib/github';
import { checkCredits, indexGithubRepo } from '@/lib/github-loader';
import { handleUserCreditsChange } from '@/lib/handleUserCreditsChange';
import { readReplicaDb2 } from '@/server/read-replica-2-db';
import type { Project } from '@/types/Project';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

interface ProjectWithCreatorId {
  id: string;
  creatorId: string;
  name: string;
  [key: string]: any;
}

export const projectRouter = createTRPCRouter({
  isProjectCreator: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projects = await readReplicaDb2.$queryRaw<Array<{ id: string; creatorId: string }>>`
        SELECT id, "creatorId" FROM "Project" WHERE id = ${input.projectId}
      `;

      if (!projects || !projects.length) {
        throw new Error('Project not found');
      }

      const project = projects[0];
      if (!project) {
        return false;
      }
      return project.creatorId === ctx.userId;
    }),
  removeProjectMember: protectedProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the current user is the creator of the project
      const project = await readReplicaDb2.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const projectWithCreator = project as unknown as ProjectWithCreatorId;

      if (projectWithCreator.creatorId !== ctx.userId) {
        throw new Error('Only the project creator can remove members');
      }

      // Don't allow removing the creator (self)
      if (input.userId === projectWithCreator.creatorId) {
        throw new Error('The project creator cannot be removed');
      }

      // Remove the user from the project
      return await ctx.db.userToProject.deleteMany({
        where: {
          projectId: input.projectId,
          userId: input.userId,
        },
      });
    }),

  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Backend project limit validation
      const user = await readReplicaDb2.user.findUnique({
        where: { id: ctx.userId! },
        select: { credits: true, emailAddress: true, firstName: true, isPro: true },
      });
      if (!user) {
        throw new Error('User not found');
      }
      const userProjectsCount = await readReplicaDb2.userToProject.count({
        where: { userId: ctx.userId! },
      });
      if (!user.isPro && userProjectsCount >= 5) {
        throw new Error(
          'You have reached the free project limit. Upgrade to create more projects.',
        );
      }

      const currentCredits = user.credits || 0;
      const fileCount = await checkCredits(input.githubUrl, input.githubToken);
      if (fileCount > 80) {
        throw new Error(
          'Project creation is disabled for repositories requiring more than 80 credits',
        );
      }

      if (fileCount > currentCredits) {
        throw new Error('Insufficient credits');
      }

      // Use a transaction for atomicity
      const result = await ctx.db.$transaction(async (prisma) => {
        // Deduct credits first
        const updatedUser = await prisma.user.update({
          where: { id: ctx.userId! },
          data: { credits: { decrement: fileCount } },
        });

        const project = await prisma.project.create({
          data: {
            githubUrl: input.githubUrl,
            name: input.name,
            creatorId: ctx.userId!,
            inviteToken: crypto.randomBytes(16).toString('hex'),
            userToProjects: {
              create: {
                userId: ctx.userId!,
              },
            },
          },
        });

        // Set the creatorId field with a raw SQL query
        await prisma.$executeRaw`UPDATE "Project" SET "creatorId" = ${ctx.userId!} WHERE id = ${project.id}`;

        // Refetch the project to get the updated data
        const updatedProject = await prisma.project.findUnique({
          where: { id: project.id },
        });

        return { project: updatedProject || project, updatedUser };
      });

      // Send low credits alert if needed (outside transaction)
      await handleUserCreditsChange({
        userId: ctx.userId!,
        userEmail: user.emailAddress,
        userName: user.firstName ?? undefined,
        credits: result.updatedUser.credits,
        discounts: [
          '10% off with Pro Plan',
          '10% off with Multi-Factor Authentication',
          'Location-based discounts available',
        ],
        prisma: ctx.db,
      });

      await indexGithubRepo(result.project.id, input.githubUrl, input.githubToken);
      await pullCommits(result.project.id);

      return result.project;
    }),

  checkProjectAccess: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if the user has access to this project
      const userToProject = await readReplicaDb2.userToProject.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.userId!,
        },
      });

      return !!userToProject; // Return true if user has access, false otherwise
    }),
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    // Use raw SQL query to avoid schema validation issues with missing columns
    const projects = await readReplicaDb2.$queryRaw<Project[]>`
      SELECT p.id, p."createdAt", p."updatedAt", p.name, p."githubUrl", p."creatorId", p."deletedAt"
      FROM "Project" p
      JOIN "UserToProject" up ON p.id = up."projectId"
      WHERE up."userId" = ${ctx.userId}
      AND p."deletedAt" IS NULL
    `;

    return projects;
  }),
  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      pullCommits(input.projectId).then().catch(console.error);
      return await readReplicaDb2.commit.findMany({
        where: { projectId: input.projectId },
      });
    }),

  getContributionStats: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const commits = await readReplicaDb2.commit.findMany({
        where: { projectId: input.projectId },
        select: {
          commitAuthorName: true,
          commitAuthorUsername: true,
          commitAuthorAvatar: true,
        },
      });

      const contributionStats = commits.reduce(
        (acc, commit) => {
          const authorId = commit.commitAuthorUsername || commit.commitAuthorName;

          if (!acc[authorId]) {
            acc[authorId] = {
              authorName: commit.commitAuthorName,
              authorUsername: commit.commitAuthorUsername,
              authorAvatar: commit.commitAuthorAvatar,
              commitCount: 0,
            };
          }

          acc[authorId].commitCount += 1;
          return acc;
        },
        {} as Record<
          string,
          {
            authorName: string;
            authorUsername: string | null;
            authorAvatar: string;
            commitCount: number;
          }
        >,
      );

      return Object.values(contributionStats).sort((a, b) => b.commitCount - a.commitCount);
    }),
  saveAnswer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        filesReferences: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.question.create({
        data: {
          answer: input.answer,
          filesReferences: input.filesReferences,
          projectId: input.projectId,
          question: input.question,
          userId: ctx.userId!,
        },
      });
    }),
  getQuestions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await readReplicaDb2.question.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }),
  deleteQuestion: protectedProcedure
    .input(z.object({ questionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First, get the question to find its projectId
      const question = await ctx.db.question.findUnique({
        where: { id: input.questionId },
        select: { projectId: true },
      });

      if (!question) {
        throw new Error('Question not found');
      } // Check if the current user is the project creator using raw query
      const projects = await readReplicaDb2.$queryRaw<Array<{ id: string; creatorId: string }>>`
        SELECT id, "creatorId" FROM "Project" WHERE id = ${question.projectId}
      `;

      if (!projects || !projects.length) {
        throw new Error('Project not found');
      }

      const project = projects[0];

      if (!project || project.creatorId !== ctx.userId) {
        throw new Error('Only the project creator can delete questions');
      }

      return await ctx.db.question.delete({
        where: { id: input.questionId },
      });
    }),
  uploadMeeting: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        meetingUrl: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.create({
        data: {
          meetingUrl: input.meetingUrl,
          projectId: input.projectId,
          name: input.name,
          status: 'PROCESSING',
        },
      });
      return meeting;
    }),
  getMeetings: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.meeting.findMany({
        where: { projectId: input.projectId },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          name: true,
          meetingUrl: true,
          projectId: true,
          status: true,
          transcript: true,
          issues: true,
        },
      });
    }),
  syncMeetingStatus: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to this meeting
      const meeting = await ctx.db.meeting.findFirst({
        where: {
          id: input.meetingId,
          project: {
            userToProjects: {
              some: {
                userId: ctx.userId!,
              },
            },
          },
        },
        include: {
          issues: true,
        },
      });

      if (!meeting) {
        throw new Error('Meeting not found or unauthorized');
      }

      // If already completed, return current status
      if (meeting.status === 'COMPLETED') {
        return {
          status: 'COMPLETED',
          hasTranscript: !!meeting.transcript,
          issuesCount: meeting.issues.length,
          message: 'Meeting already completed',
        };
      }

      // If still processing or failed, try to re-trigger the processing
      if (meeting.status === 'PROCESSING' || meeting.status === 'FAILED') {
        try {
          // Import the processMeeting function
          const { processMeeting } = await import('@/lib/assembly');

          // Re-process the meeting
          const { summaries, transcript } = await processMeeting(meeting.meetingUrl);

          // Update the database
          await ctx.db.issue.createMany({
            data: summaries.map((summary) => ({
              start: summary.start,
              end: summary.end,
              gist: summary.gist,
              headline: summary.headline,
              summary: summary.summary,
              meetingId: meeting.id,
            })),
            skipDuplicates: true, // Avoid duplicates if already exists
          });

          await ctx.db.meeting.update({
            where: { id: meeting.id },
            data: {
              status: 'COMPLETED',
              name: summaries[0]?.headline || meeting.name,
              transcript: transcript,
            },
          });

          return {
            status: 'COMPLETED',
            hasTranscript: true,
            issuesCount: summaries.length,
            message: 'Meeting processing completed successfully',
          };
        } catch (error) {
          console.error('Error re-processing meeting:', error);

          // Update meeting status to FAILED in the database
          await ctx.db.meeting.update({
            where: { id: meeting.id },
            data: {
              status: 'FAILED',
            },
          });

          return {
            status: 'FAILED',
            hasTranscript: !!meeting.transcript,
            issuesCount: meeting.issues.length,
            message: 'Meeting processing failed. You can try refreshing again.',
          };
        }
      }

      // Handle other statuses
      return {
        status: meeting.status,
        hasTranscript: !!meeting.transcript,
        issuesCount: meeting.issues.length,
        message: `Meeting status: ${meeting.status}`,
      };
    }),
  deleteMeeting: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First, get the meeting to find its projectId
      const meeting = await readReplicaDb2.meeting.findUnique({
        where: { id: input.meetingId },
        select: { projectId: true },
      });

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Check if the current user is the project creator
      const project = await readReplicaDb2.project.findUnique({
        where: { id: meeting.projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Use type assertion to access creatorId
      const projectWithCreator = project as unknown as ProjectWithCreatorId;

      if (projectWithCreator.creatorId !== ctx.userId) {
        throw new Error('Only the project creator can delete meetings');
      }

      return await ctx.db.meeting.delete({ where: { id: input.meetingId } });
    }),

  getMeetingTranscript: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ input }) => {
      const meeting = await readReplicaDb2.meeting.findUnique({
        where: { id: input.meetingId },
        select: {
          transcript: true,
          name: true,
        },
      });

      if (!meeting || !meeting.transcript) {
        throw new Error('Transcript not found');
      }

      return {
        transcript: meeting.transcript,
        name: meeting.name,
      };
    }),
  getMeetingById: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ input }) => {
      return await readReplicaDb2.meeting.findUnique({
        where: { id: input.meetingId },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          name: true,
          meetingUrl: true,
          projectId: true,
          status: true,
          issues: true,
        },
      });
    }),
  archiveProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the current user is the creator of the project
      const project = await readReplicaDb2.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Use type assertion to access creatorId
      const projectWithCreator = project as unknown as ProjectWithCreatorId;

      if (projectWithCreator.creatorId !== ctx.userId) {
        throw new Error('Only the project creator can archive this project');
      }

      return await ctx.db.project.update({
        where: { id: input.projectId },
        data: { deletedAt: new Date() },
      });
    }),
  getTeamMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const members = await readReplicaDb2.userToProject.findMany({
        where: { projectId: input.projectId },
        include: {
          user: {
            select: {
              id: true,
              createdAt: true,
              updatedAt: true,
              emailAddress: true,
              imageUrl: true,
              firstName: true,
              lastName: true,
              credits: true,
              lowCreditsEmailSent: true,
              isPro: true,
            },
          },
        },
      });
      return members.map((m) => m.user);
    }),
  getMyCredits: protectedProcedure.query(async ({ ctx }) => {
    const user = await readReplicaDb2.user.findUnique({
      where: { id: ctx.userId! },
    });
    return user;
  }),
  getMyTransactions: protectedProcedure.query(async ({ ctx }) => {
    const transactions = await readReplicaDb2.stripeTransaction.findMany({
      where: { userId: ctx.userId! },
      orderBy: { createdAt: 'desc' },
    });
    return transactions;
  }),
  checkCredits: protectedProcedure
    .input(z.object({ githubUrl: z.string(), githubToken: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const fileCount = await checkCredits(input.githubUrl, input.githubToken);
        const userCredits = await readReplicaDb2.user.findUnique({
          where: { id: ctx.userId! },
          select: { credits: true },
        });

        return {
          fileCount,
          userCredits: userCredits?.credits || 0,
          isValid: true,
          error: null,
        };
      } catch (error: any) {
        return {
          fileCount: 0,
          userCredits: 0,
          isValid: false,
          error: error.message || 'Failed to check repository',
        };
      }
    }),
  regenerateInviteLink: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the current user is the project creator using raw query
      const projects = await readReplicaDb2.$queryRaw<Array<{ id: string; creatorId: string }>>`
        SELECT id, "creatorId" FROM "Project" WHERE id = ${input.projectId}
      `;

      if (!projects || !projects.length) {
        throw new Error('Project not found');
      }

      const project = projects[0];

      if (!project || project.creatorId !== ctx.userId) {
        throw new Error('Only the project creator can regenerate invite links');
      }

      // Generate a new random token with timestamp to ensure uniqueness
      const timestamp = Date.now().toString();
      const randomBytes = crypto.randomBytes(16).toString('hex');
      const newToken = `${randomBytes}-${timestamp}`;

      console.log(
        `Regenerating invite token for project ${input.projectId}. New token: ${newToken}`,
      );

      // Update the project with the new token using raw SQL to avoid schema validation issues
      await ctx.db.$executeRaw`
        UPDATE "Project"
        SET "inviteToken" = ${newToken}
        WHERE id = ${input.projectId}
      `;

      return { inviteToken: newToken };
    }),
  toggleInvitationEnabled: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the current user is the project creator
      const projects = await readReplicaDb2.$queryRaw<
        Array<{ id: string; creatorId: string; invitationEnabled: boolean }>
      >`
        SELECT id, "creatorId", "invitationEnabled" FROM "Project" WHERE id = ${input.projectId}
      `;

      if (!projects || !projects.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      const project = projects[0];

      if (!project || project.creatorId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the project creator can toggle invitations.',
        });
      }

      // Toggle the invitationEnabled value
      const newStatus = !project.invitationEnabled;

      // Update the project using raw SQL to avoid schema validation issues
      await ctx.db.$executeRaw`
        UPDATE "Project"
        SET "invitationEnabled" = ${newStatus}
        WHERE id = ${input.projectId}
      `;

      return { invitationEnabled: newStatus };
    }),
  hasProjectAccess: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if the user has access to this project
      const membership = await ctx.db.userToProject.findFirst({
        where: {
          userId: ctx.userId!,
          projectId: input.projectId,
        },
      });

      return !!membership;
    }),
  verifyInviteToken: protectedProcedure
    .input(z.object({ projectId: z.string(), token: z.string() }))
    .query(async ({ input }) => {
      // Check if the provided token matches the project's invite token
      const result = await readReplicaDb2.$queryRaw<Array<{ inviteToken: string }>>`
        SELECT "inviteToken" FROM "Project" WHERE id = ${input.projectId}
      `;

      if (!result || !result.length) {
        throw new Error('Project not found');
      }

      const project = result[0];
      return !!project && project.inviteToken === input.token;
    }),
  getProjectById: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // First check if user has access to this project
      const userToProject = await ctx.db.userToProject.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.userId!,
        },
      });

      if (!userToProject) {
        throw new Error('You do not have access to this project');
      }

      // Get project with inviteToken using raw query
      const projects = await readReplicaDb2.$queryRaw<Project[]>`
        SELECT id, name, "githubUrl", "creatorId", "deletedAt", "createdAt", "updatedAt", "inviteToken", "invitationEnabled" FROM "Project" WHERE id = ${input.projectId}
      `;

      if (!projects || !projects.length) {
        throw new Error('Project not found');
      }

      return projects[0];
    }),
  leaveProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Remove the current user from the project
      await ctx.db.userToProject.deleteMany({
        where: {
          projectId: input.projectId,
          userId: ctx.userId!,
        },
      });
      return { success: true };
    }),
});
