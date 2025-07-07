import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import db from '@/lib/prisma';

// Export only non-sensitive user data, grouped for clarity
export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User profile info (safe fields only)
  const user = await db.user.findUnique({
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
  const userProjects = await db.userToProject.findMany({
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

  // User's questions
  const questions = await db.question.findMany({
    where: { userId },
    select: {
      id: true,
      question: true,
      answer: true,
      filesReferences: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // User's Stripe transactions
  const stripeTransactions = await db.stripeTransaction.findMany({
    where: { userId },
    select: {
      id: true,
      credits: true,
      isCompleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    userProfile: user,
    projects: (userProjects as Array<{ project: any }>).map((up) => up.project),
    questions,
    stripeTransactions,
  });
}
