import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { env } from '@/env.js';

type Props = {};

const syncUser = async ({}: Props) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return redirect(new URL('/sign-in', env.NEXT_PUBLIC_BASE_URL));
    }
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return redirect(new URL('/sign-in', env.NEXT_PUBLIC_BASE_URL));
    }
    await db.user.upsert({
      where: { emailAddress: email },
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
    return redirect(new URL('/onboarding', env.NEXT_PUBLIC_BASE_URL));
  } catch (error) {
    return redirect(new URL('/onboarding', env.NEXT_PUBLIC_BASE_URL));
  }
};

export default syncUser;
