import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pullCommits } from "@/lib/github";
import { checkCredits, indexGithubRepo } from "@/lib/github-loader";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.userId! },
        select: { credits: true },
      });
      if (!user) {
        throw new Error("User not found");
      }

      const currentCredits = user.credits || 0;
      const fileCount = await checkCredits(input.githubUrl, input.githubToken);
      if (fileCount > 80) {
        throw new Error("Project creation is disabled for repositories requiring more than 80 credits");
      }

      if (fileCount > currentCredits) {
        throw new Error("Insufficient credits");
      }

      // Use a transaction for atomicity
      const result = await ctx.db.$transaction(async (prisma) => {
        // Deduct credits first
        await prisma.user.update({
          where: { id: ctx.user.userId! },
          data: { credits: { decrement: fileCount } },
        });

        const project = await prisma.project.create({
          data: {
            githubUrl: input.githubUrl,
            name: input.name,
            userToProjects: {
              create: {
                userId: ctx.user.userId!,
              },
            },
          },
        });

        return project;
      });

      await indexGithubRepo(result.id, input.githubUrl, input.githubToken);
      await pullCommits(result.id);

      return result;
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        userToProjects: {
          some: {
            userId: ctx.user.userId!,
          },
        },
        deletedAt: null,
      },
    });
  }),
  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      pullCommits(input.projectId).then().catch(console.error);
      return await ctx.db.commit.findMany({
        where: { projectId: input.projectId },
      });
    }),
    
  getContributionStats: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const commits = await ctx.db.commit.findMany({
        where: { projectId: input.projectId },
        select: {
          commitAuthorName: true,
          commitAuthorUsername: true,
          commitAuthorAvatar: true,
        }
      });
      
      const contributionStats = commits.reduce((acc, commit) => {
        const authorId = commit.commitAuthorUsername || commit.commitAuthorName;
        
        if (!acc[authorId]) {
          acc[authorId] = {
            authorName: commit.commitAuthorName,
            authorUsername: commit.commitAuthorUsername,
            authorAvatar: commit.commitAuthorAvatar,
            commitCount: 0
          };
        }
        
        acc[authorId].commitCount += 1;
        return acc;
      }, {} as Record<string, { authorName: string; authorUsername: string | null; authorAvatar: string; commitCount: number }>);
      
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
          userId: ctx.user.userId!,
        },
      });
    }),
  getQuestions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.question.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
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
          status: "PROCESSING",
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
          issues: true
        }
      });
    }),
  deleteMeeting: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.meeting.delete({ where: { id: input.meetingId } });
    }),
  getMeetingById: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.meeting.findUnique({
        where: { id: input.meetingId },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          name: true,
          meetingUrl: true,
          projectId: true,
          status: true,
          issues: true
        }
      });
    }),
  archiveProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.project.update({
        where: { id: input.projectId },
        data: { deletedAt: new Date() },
      });
    }),
  getTeamMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.userToProject.findMany({
        where: { projectId: input.projectId },
        include: { user: true },
      });
    }),
  getMyCredits: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.userId! },
    });
    return user;
  }),
  getMyTransactions: protectedProcedure.query(async ({ ctx }) => {
    const transactions = await ctx.db.stripeTransaction.findMany({
      where: { userId: ctx.user.userId! },
      orderBy: { createdAt: 'desc' },
    });
    return transactions;
  }),
  checkCredits: protectedProcedure
    .input(z.object({ githubUrl: z.string(), githubToken: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const fileCount = await checkCredits(input.githubUrl, input.githubToken);
        const userCredits = await ctx.db.user.findUnique({
          where: { id: ctx.user.userId! },
          select: { credits: true },
        });
        
        return { 
          fileCount, 
          userCredits: userCredits?.credits || 0,
          isValid: true,
          error: null
        };
      } catch (error: any) {
        return {
          fileCount: 0,
          userCredits: 0,
          isValid: false,
          error: error.message || "Failed to check repository"
        };
      }
    }),
});
