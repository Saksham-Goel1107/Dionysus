'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import React, { useState, useEffect } from 'react';

export default function ClerkProviderWithTheme({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ClerkProvider
      appearance={{
        baseTheme: mounted && resolvedTheme === 'dark' ? [dark] : undefined,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
