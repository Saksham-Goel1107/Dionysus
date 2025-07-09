import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CouponsManagement from '../components/CouponsManagement';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CouponsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== 'sakshamgoel1107@gmail.com') {
    redirect('/');
  }

  return <CouponsManagement />;
}
