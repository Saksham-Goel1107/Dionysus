import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

type Props = {};

const Page = async ({}: Props) => {

  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const client = await clerkClient();

  try {
    const user = await client.users.getUser(userId);

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      notFound();
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

    redirect('/dashboard');
  } catch (error: any) {
    if (error.message === 'Not Found' && error.status === 404) {
      redirect('/sign-out');
    }
    throw error;
  }
};

export default Page;
