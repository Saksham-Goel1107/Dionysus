import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

type Props = {};



const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const Loading = dynamic(() => import('./loading'), { ssr: false });

const Page = async ({}: Props) => {
  // Show loading screen during 2s buffer
  await sleep(2000);
  return (
    <Suspense fallback={<div />}>
      <LoadingWrapper />
    </Suspense>
  );
};

async function LoadingWrapper() {
  try {
    const { userId } = await auth();
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
    return redirect('/onboarding');
  } catch (error) {
    return redirect('/onboarding');
  }
}

export default Page;
