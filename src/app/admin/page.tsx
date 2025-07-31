import { db } from '@/server/db';
import AdminDashboard from './components/AdminDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  // Fetch key metrics for the dashboard
  const totalUsers = await db.user.count();
  const proUsers = await db.user.count({ where: { isPro: true } });
  const totalProjects = await db.project.count();
  const totalCredits = await db.user.aggregate({
    _sum: { credits: true },
  });

  // Fetch recent transactions
  const recentTransactions = await db.stripeTransaction.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  // Calculate total revenue
  const totalRevenue = await db.stripeTransaction.aggregate({
    where: { isCompleted: true },
    _sum: { credits: true },
  });

  // Estimate revenue (assuming 75 INR per 50 credits)
  const estimatedRevenue = (totalRevenue._sum.credits || 0) * (75 / 50);

  // Get user growth data (users per month)
  const currentDate = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 5); // Get last 6 months including current

  const userGrowthData = await db.$queryRaw<any[]>`
    SELECT
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as count
    FROM "User"
    WHERE "createdAt" >= ${sixMonthsAgo}
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month ASC
  `;

  // Fetch data for top users by credits
  const topUsersByCredits = await db.user.findMany({
    take: 5,
    orderBy: { credits: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      emailAddress: true,
      credits: true,
      isPro: true,
    },
  });

  return (
    <AdminDashboard
      totalUsers={totalUsers}
      proUsers={proUsers}
      totalProjects={totalProjects}
      totalCredits={totalCredits._sum.credits || 0}
      estimatedRevenue={estimatedRevenue}
      recentTransactions={recentTransactions}
      userGrowthData={userGrowthData}
      topUsersByCredits={topUsersByCredits}
    />
  );
}
