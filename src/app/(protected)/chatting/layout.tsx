import React from 'react';
import CommunitySidebar from './_components/CommunitySidebar';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth } from '@clerk/nextjs/server';

export default async function ChattingLayout({ children }: { children: React.ReactNode }) {
  const { has } = await auth();
  const hasProPlan = has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });

  if (!hasProPlan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <Lock className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className={`text-center text-2xl font-bold dark:text-white text-gray-800`}>
          Pro Plan Required
        </h2>
        <p className={`text-center dark:text-gray-200 text-gray-600 max-w-md`}>
          Access to Chatting is available exclusively for{' '}
          <span className="font-semibold text-yellow-700">Dionysus Pro Pack</span> users.
          <br />
          Upgrade your plan to unlock this feature.
        </p>
        <Link href="/subscriptions">
          <Button
            size="lg"
            className="mt-2 bg-yellow-600 text-white hover:bg-yellow-700 w-full max-w-xs"
          >
            Upgrade Now
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile: Sidebar on top, Chat below; Desktop: Sidebar left, Chat right */}
      <div className="flex flex-col md:flex-row h-screen md:h-[100dvh] w-full">
        <CommunitySidebar />
        <main
          className="flex-1 flex justify-center items-start md:items-center px-0 md:px-8 py-0 md:py-0 overflow-x-auto overflow-y-hidden"
          style={{
            height: '80vh',
            minHeight: '80vh',
            overflowY: 'hidden', // Prevent y-scroll on mobile
            overflowX: 'auto', // Allow x-scroll on mobile
          }}
        >
          <div className="w-full h-full min-w-[400px] max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
