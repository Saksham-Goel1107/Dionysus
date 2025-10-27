'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import React from 'react';

export default function ClerkProviderWithTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
      }}
      waitlistUrl="/waitlist"
      signUpUrl="/sign-up"
      signInUrl="/sign-in"
    >
      {children}
    </ClerkProvider>
  );
}
