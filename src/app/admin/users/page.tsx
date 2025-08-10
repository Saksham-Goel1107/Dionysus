import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import UsersManagement from '../components/UsersManagement';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UsersPage() {
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

  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  if (!CLERK_SECRET_KEY) {
    throw new Error('Missing Clerk secret key');
  }

  const clerkUsersRes = await fetch(`https://api.clerk.com/v1/users?limit=200`, {
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!clerkUsersRes.ok) {
    throw new Error(`Failed to fetch Clerk users: ${await clerkUsersRes.text()}`);
  }

  const clerkUsers = await clerkUsersRes.json();

  const dbUsers = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
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
        select: { projectId: true },
      },
      stripeTransactions: {
        select: { credits: true, isCompleted: true },
        where: { isCompleted: true },
      },
    },
  });

  const enhancedUsers = dbUsers.map((dbUser) => {
    const clerkUser = clerkUsers.find((cu: any) => cu.id === dbUser.id);
    const publicMetadata = clerkUser?.public_metadata || {};

    const totalProjects = dbUser.userToProjects.length;
    const totalPurchasedCredits = dbUser.stripeTransactions.reduce(
      (total, tx) => total + tx.credits,
      0,
    );

    return {
      ...dbUser,
      createdAt: dbUser.createdAt.toISOString(),
      totalProjects,
      totalPurchasedCredits,
      isBlocked: publicMetadata.isBlocked || false,
      onboardingComplete: publicMetadata.onboardingComplete || false,
      userToProjects: undefined,
      stripeTransactions: undefined,
    };
  });

  return <UsersManagement users={enhancedUsers} />;
}
