'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminClient() {
  const router = useRouter();

  // Redirect to the main dashboard page - this is just a wrapper for backwards compatibility
  useEffect(() => {
    router.push('/admin');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p>Redirecting to admin dashboard...</p>
      </div>
    </div>
  );
}
