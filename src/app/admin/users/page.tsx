import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import UsersManagement from '../components/UsersManagement';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UsersPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== 'sakshamgoel1107@gmail.com') {
    redirect('/');
  }

  // Fetch all users with pagination (server-side)
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit for initial load
    select: {
      id: true,
      createdAt: true,
      firstName: true,
      lastName: true,
      emailAddress: true,
      imageUrl: true,
      credits: true,
      isPro: true,
      userToProjects: {
        select: {
          projectId: true,
        },
      },
      stripeTransactions: {
        select: {
          credits: true,
          isCompleted: true,
        },
        where: {
          isCompleted: true,
        },
      },
    },
  });

  // Process and enhance user data
  const enhancedUsers = users.map((user) => {
    const totalProjects = user.userToProjects.length;
    const totalPurchasedCredits = user.stripeTransactions.reduce(
      (total, tx) => total + tx.credits,
      0,
    );

    return {
      ...user,
      createdAt: user.createdAt.toISOString(), // Convert Date to string
      totalProjects,
      totalPurchasedCredits,
      userToProjects: undefined, // Remove nested data
      stripeTransactions: undefined, // Remove nested data
    };
  });

  return <UsersManagement users={enhancedUsers} />;
}
