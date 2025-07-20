'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SyncUserPage() {
  const router = useRouter();

  useEffect(() => {
    const syncUser = async () => {
      try {
        const res = await fetch('/api/sync-user');
        const { redirect } = await res.json();
        if (redirect) {
          router.replace(redirect);
        } else {
          router.replace('/onboarding');
        }
      } catch (err) {
        console.error('Sync user fetch failed:', err);
        router.replace('/onboarding');
      }
    };

    syncUser();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-gray-600 dark:text-gray-300">
      Syncing your account...
    </div>
  );
}
