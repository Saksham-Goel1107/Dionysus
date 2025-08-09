'use client';

import { useEffect } from 'react';

interface AutoRefreshProps {
  interval?: number; // in seconds
  enabled?: boolean;
}

export default function AutoRefresh({ interval = 15, enabled = true }: AutoRefreshProps) {
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      window.location.reload();
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [interval, enabled]);

  return null; // This component doesn't render anything
}
