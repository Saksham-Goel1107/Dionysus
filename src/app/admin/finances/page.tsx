import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import FinancesDashboard from '../components/FinancesDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FinancesPage() {
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

  // Get all transaction data
  const transactions = await db.stripeTransaction.findMany({
    where: { isCompleted: true },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          emailAddress: true,
          isPro: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate revenue stats
  const totalCredits = transactions.reduce((sum, tx) => sum + tx.credits, 0);
  const totalRevenue = totalCredits * (75 / 50); // Based on 75 INR per 50 credits

  // Get monthly revenue data for the last 12 months
  const today = new Date();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(today.getMonth() - 11); // Get last 12 months

  const monthlyRevenue = await db.$queryRaw<any[]>`
    SELECT
      DATE_TRUNC('month', "createdAt") as month,
      SUM(credits) as total_credits
    FROM "StripeTransaction"
    WHERE "createdAt" >= ${twelveMonthsAgo} AND "isCompleted" = true
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month ASC
  `;

  return (
    <FinancesDashboard
      transactions={transactions}
      totalRevenue={totalRevenue}
      totalCredits={totalCredits}
      monthlyRevenue={monthlyRevenue}
    />
  );
}
