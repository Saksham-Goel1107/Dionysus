import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

type Props = {};

const Page = async ({}: Props) => {
  const { userId } = await auth();

  if (!userId) {
    return redirect('/sign-in');
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard';
    return null;
  }

  const client = await clerkClient();
  
  try {
    const user = await client.users.getUser(userId);

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return notFound();
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

    return redirect('/dashboard');
  } catch (error: any) {
    if (error.message === 'Not Found' && error.status === 404) {
      return redirect('/sign-out');
    }
    throw error; // Re-throw other errors
  }
};

export default Page;
