import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

type Props = {};

// Function to sync user data with the database
async function syncUserToDB() {
  const { userId } = await auth();
  if (!userId) {
    return false;
  }
  
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return false;
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
    return true;
  } catch (error) {
    console.error('Error syncing user:', error);
    return false;
  }
}

const Page = async ({}: Props) => {
  // Sync the user and then redirect
  await syncUserToDB();
  
  // Always redirect to dashboard after sync attempt
  redirect('/dashboard');
};

export default Page;
