import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      redirect('/sign-in');
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      redirect('/sign-in');
    }

    const result = await db.$transaction(async (tx) => {
      const upsertedUser = await tx.user.upsert({
        where: { id: userId },
        update: {
          imageUrl: user.imageUrl,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        create: {
          id: userId,
          emailAddress: email,
          imageUrl: user.imageUrl,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        select: { SurveyDone: true }
      });
      return upsertedUser;
    });

    if (userId && !sessionClaims?.metadata?.onboardingComplete) {
      redirect('/onboarding');
    }

    if (result.SurveyDone) {
      redirect('/dashboard');
    } else {
      redirect('/survey-check');
    }

  } catch (error) {
    console.error('Database error in syncUser:', error);
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
      console.error('Unique constraint violation');
    }
    redirect('/onboarding');
  }
}
