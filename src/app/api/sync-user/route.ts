import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { db } from '@/server/db';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ redirect: '/sign-in' });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ redirect: '/sign-in' });
    }

    const user = await db.user.upsert({
      where: { id: userId },
      update: {
        imageUrl: clerkUser.imageUrl || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
      },
      create: {
        id: userId,
        emailAddress: email,
        imageUrl: clerkUser.imageUrl || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
      },
      select: { SurveyDone: true },
    });

    const onboardingDone = sessionClaims?.metadata?.onboardingComplete;

    if (!onboardingDone) {
      return NextResponse.json({ redirect: '/onboarding' });
    }

    if (user.SurveyDone) {
      return NextResponse.json({ redirect: '/dashboard' });
    }

    return NextResponse.json({ redirect: '/survey-check' });

  } catch (error) {
    console.error('[sync-user] error:', error);
    return NextResponse.json({ redirect: '/onboarding' });
  }
}
