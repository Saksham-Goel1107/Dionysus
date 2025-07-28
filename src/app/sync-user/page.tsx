import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return redirect('/sign-in');
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;

  if (!email) {
    return redirect('/sign-in');
  }

  let result;
  try {
    result = await db.$transaction(async (tx) => {
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
        select: { SurveyDone: true },
      });
      return upsertedUser;
    });
  } catch (error) {
    console.error('Database error in syncUser:', error);
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      console.error('Unique constraint violation');
    }
    return redirect('/onboarding');
  }

  if (userId && !sessionClaims?.metadata?.onboardingComplete) {
    return redirect('/onboarding');
  }

  if (result.SurveyDone) {
    return redirect('/dashboard');
  } else {
    return redirect('/survey-check');
  }
}
