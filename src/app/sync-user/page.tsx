import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

type Props = {};

const Page = async ({}: Props) => {
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
};

export default Page;
