'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const COOLDOWN_SECONDS = 30;

export default function RateLimitRedirector() {
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.replace(from);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, from, router]);

  return (
    <div className="mt-8">
      <button
        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        disabled
      >
        Redirecting in {secondsLeft}s...
      </button>
    </div>
  );
}
