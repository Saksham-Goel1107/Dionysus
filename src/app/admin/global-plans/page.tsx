import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import GlobalPlansManagement from '../components/GlobalPlansManagement';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GlobalPlansPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/');

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  if (
    email !== process.env.ADMIN_EMAIL ||
    userId !== process.env.ADMIN_USER_ID ||
    sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET
  ) {
    redirect('/');
  }

  return <GlobalPlansManagement />;
}
