import React from 'react';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import AdminSidebar from './components/AdminSidebar';
import AutoRefresh from './components/AutoRefresh';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    throw redirect('/sign-in');
  }

  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    throw redirect('/');
  }
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;

  if (!sessionClaims?.metadata?.role) {
    throw redirect('/');
  }

  const isAdmin =
    userEmail === process.env.ADMIN_EMAIL &&
    userId === process.env.ADMIN_USER_ID &&
    sessionClaims?.metadata?.role === `${process.env.ADMIN_SECRET}`;

  if (!isAdmin) {
    throw redirect('/');
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <AutoRefresh interval={15} enabled={true} />
        {children}
      </main>
    </div>
  );
}
