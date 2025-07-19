import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

type Props = {};

const syncUser = async ({}: Props) => {
  try {
    const { userId,sessionClaims } = await auth();
    if (!userId) {
      return redirect('/sign-in');
    }
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return redirect('/sign-in');
    }
    await db.user.upsert({
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
    });

    if (userId && !sessionClaims?.metadata?.onboardingComplete) {
      return redirect('/onboarding');
    }
    const servey = await db.user.findUnique({ where: { id: userId }, select: { SurveyDone: true } });
    if (servey?.SurveyDone) {
      return redirect('/dashboard');
    }
    else{
      return redirect('/survey-check');
    }
  } catch (error) {
    console.error(error);
    return redirect('/onboarding');
  }
};

export default syncUser;
