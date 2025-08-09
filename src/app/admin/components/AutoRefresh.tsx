'use client';

import { useEffect } from 'react';

interface AutoRefreshProps {
  interval?: number;
}

export default function AutoRefresh({ interval = 15 }: AutoRefreshProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    const timer = setInterval(() => {
      window.location.reload();
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [interval]);

  return null;
}
