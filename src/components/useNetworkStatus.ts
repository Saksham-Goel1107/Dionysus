'use client';

import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [isVerySlow, setIsVerySlow] = useState(false);

  useEffect(() => {
    const checkSpeed = async () => {
      try {
        const start = performance.now();
        const res = await fetch('/favicon.ico?_t=' + Date.now(), {
          cache: 'no-store',
        });
        const end = performance.now();

        const duration = end - start;

        if (!res.ok || duration > 3000) {
          setIsVerySlow(true);
        } else {
          setIsVerySlow(false);
        }
      } catch {
        setIsVerySlow(true);
      }
    };

    const handleStatus = () => {
      setIsOffline(!navigator.onLine);
      if (navigator.onLine) checkSpeed();
    };

    handleStatus();

    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    const interval = setInterval(() => {
      if (navigator.onLine) checkSpeed();
    }, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  return { isOffline, isVerySlow };
}
