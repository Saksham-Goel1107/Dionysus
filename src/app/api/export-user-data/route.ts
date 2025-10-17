import { readReplicaDb } from '@/server/read-replica-db';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Export only non-sensitive user data, grouped for clarity
export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User profile info (safe fields only)
  const user = await readReplicaDb.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      emailAddress: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
      credits: true,
      isPro: true,
    },
  });

  // Projects the user is a member of, with commits
  const userProjects = await readReplicaDb.userToProject.findMany({
    where: { userId },
    select: {
      project: {
        select: {
          id: true,
          name: true,
          githubUrl: true,
          createdAt: true,
          updatedAt: true,
          commits: {
            select: {
              id: true,
              commitHash: true,
              commitMessage: true,
              commitDate: true,
              commitAuthorName: true,
              commitAuthorUsername: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  // User's survey responses
  const survey = await readReplicaDb.survey.findUnique({
    where: { userId },
    select: {
      companyName: true,
      companySize: true,
      industry: true,
      role: true,
      usagePurpose: true,
      hearAboutUs: true,
      expectedFeatures: true,
      developmentExperience: true,
      githubExperience: true,
      feedbackFrequency: true,
      additionalFeedback: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Meetings from projects the user has access to
  const projectIds = userProjects.map((up) => up.project.id);
  const meetings = await readReplicaDb.meeting.findMany({
    where: {
      projectId: { in: projectIds },
    },
    select: {
      id: true,
      name: true,
      meetingUrl: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      issues: {
        select: {
          id: true,
          start: true,
          end: true,
          gist: true,
          headline: true,
          summary: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  // User's blog comments
  const comments = await readReplicaDb.comment.findMany({
    where: { userId },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      editedAt: true,
      blog: {
        select: {
          id: true,
          title: true,
          slug: true,
          isPublished: true,
        },
      },
      parentId: true,
      _count: {
        select: {
          replies: true,
          likes: true,
        },
      },
    },
  });

  // Blogs the user has liked
  const blogLikes = await readReplicaDb.blogLike.findMany({
    where: { userId },
    select: {
      isLike: true,
      createdAt: true,
      blog: {
        select: {
          id: true,
          title: true,
          slug: true,
          isPublished: true,
          createdAt: true,
        },
      },
    },
  });

  // Comments the user has liked
  const commentLikes = await readReplicaDb.commentLike.findMany({
    where: { userId },
    select: {
      isLike: true,
      createdAt: true,
      comment: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          blog: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Coupons the user has used
  const couponUsages = await readReplicaDb.couponUsage.findMany({
    where: { userId },
    select: {
      usedAt: true,
      coupon: {
        select: {
          discount: true,
          expiresAt: true,
          maxUses: true,
          isExpired: true,
          createdAt: true,
        },
      },
    },
  });

  // Global plans the user has used
  const globalPlanUsages = await readReplicaDb.globalPlanUsage.findMany({
    where: { userId },
    select: {
      usedAt: true,
      globalPlan: {
        select: {
          name: true,
          description: true,
          discount: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    userProfile: user,
    survey,
    projects: (userProjects as Array<{ project: any }>).map((up) => up.project),
    meetings,
    comments,
    blogLikes,
    commentLikes,
    couponUsages,
    globalPlanUsages,
  });
}
