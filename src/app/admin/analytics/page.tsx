import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AnalyticsPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/');
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (
    email !== process.env.ADMIN_EMAIL ||
    userId !== process.env.ADMIN_USER_ID ||
    sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET
  ) {
    redirect('/');
  }

  // User stats
  const userStats = {
    total: await db.user.count(),
    pro: await db.user.count({ where: { isPro: true } }),
  };

  // Project stats
  const projectStats = {
    total: await db.project.count(),
    active: await db.project.count({ where: { deletedAt: null } }),
  };

  // Question stats
  const questionStats = {
    total: await db.question.count(),
  };

  // Meeting stats
  const meetingStats = {
    total: await db.meeting.count(),
    completed: await db.meeting.count({ where: { status: 'COMPLETED' } }),
    processing: await db.meeting.count({ where: { status: 'PROCESSING' } }),
  };

  // Get daily activity data (questions asked per day) for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyQuestionActivity = await db.$queryRaw<{ day: Date; count: number }[]>`
    SELECT
      DATE_TRUNC('day', "createdAt") as day,
      COUNT(*) as count
    FROM "Question"
    WHERE "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE_TRUNC('day', "createdAt")
    ORDER BY day ASC
  `;

  // Get project creation over time
  const projectGrowth = await db.$queryRaw<{ month: Date; count: number }[]>`
    SELECT
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as count
    FROM "Project"
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month ASC
  `;

  // Get embedding count by project (top 10)
  const topProjectsByEmbeddings = await db.project.findMany({
    take: 10,
    orderBy: {
      sourceCodeEmbeddings: {
        _count: 'desc',
      },
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          sourceCodeEmbeddings: true,
        },
      },
    },
  });

  return (
    <AnalyticsDashboard
      userStats={userStats}
      projectStats={projectStats}
      questionStats={questionStats}
      meetingStats={meetingStats}
      dailyQuestionActivity={dailyQuestionActivity}
      projectGrowth={projectGrowth}
      topProjectsByEmbeddings={topProjectsByEmbeddings}
    />
  );
}
