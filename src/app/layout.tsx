import '@/styles/globals.css';

import { GeistSans } from 'geist/font/sans';
import { type Metadata } from 'next';

import { TRPCReactProvider } from '@/trpc/react';
import { checkAndSyncProStatus } from '@/lib/checkAndSyncProStatus';

import { ClerkProvider, GoogleOneTap } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { Toaster } from 'sonner';
import Providers from './Providers';
import { ThemeProvider } from './components/theme-provider';
import CookieBanner from './components/CookieBanner';
import MaintenanceScreen from '../components/updates/screen';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';
import CustomContextMenu from '@/components/ui/CustomContextMenu';
import BlockInspectAndContext from '@/components/BlockInspectAndContext';
import MultisessionAppSupport from './MultiSession';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import Script from 'next/script';

export const metadata: Metadata = {
  title: {
    default: 'Dionysus – Your AI Github Assistant',
    template: '%s | Dionysus',
  },
  description:
    'Dionysus is your AI-powered GitHub assistant, helping you code smarter and faster. Get instant help, code suggestions, and productivity tools for developers.',
  metadataBase: new URL('https://dionysus-gray.vercel.app'),
  keywords: [
    'AI',
    'GitHub',
    'assistant',
    'developer tools',
    'productivity',
    'coding',
    'typescript',
    'react',
    'nextjs',
    'trpc',
    'open source',
    'prisma',
    'stripe',
    'saas',
    'automation',
    'chatbot',
    'livekit',
    'cloudinary',
    'tailwindcss',
    'zod',
    'clerk',
    'vercel',
    'stream',
    'web development',
    'frontend',
    'backend',
    'fullstack',
  ],
  authors: [{ name: 'Saksham Goel', url: 'https://dionysus-gray.vercel.app' }],
  creator: 'Saksham Goel',
  openGraph: {
    title: 'Dionysus – Your AI Github Assistant',
    description:
      'Dionysus is your AI-powered GitHub assistant, helping you code smarter and faster.',
    url: 'https://dionysus-gray.vercel.app',
    siteName: 'Dionysus',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Dionysus – Your AI Github Assistant',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dionysus – Your AI Github Assistant',
    description:
      'Dionysus is your AI-powered GitHub assistant, helping you code smarter and faster.',
    images: ['/logo.png'],
    creator: '@saksham',
  },
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/logo.png' },
  ],
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export const viewport = {
  themeColor: '#111827',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode; params: { slug: string[] } }>) {
  const { userId } = await auth();

  if (userId) {
    await checkAndSyncProStatus(userId);
  }

  const isMaintenance = process.env.NEXT_PUBLIC_MAINTAINENCE_MODE === 'true';

  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <ErrorBoundary>
        <ClerkProvider>
          <MultisessionAppSupport>
            <body>
              {isMaintenance ? (
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <MaintenanceScreen />
                  <BlockInspectAndContext />
                  <CustomContextMenu />
                  <Analytics />
                  <SpeedInsights />
                </ThemeProvider>
              ) : (
                <>
                  <GoogleOneTap cancelOnTapOutside={true} itpSupport={true} fedCmSupport={true} />
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                  >
                    <CookieBanner />
                    <TRPCReactProvider>
                      {userId ? <Providers>{children}</Providers> : <>{children}</>}
                    </TRPCReactProvider>
                    <Toaster richColors />
                    <ScrollToTopButton />
                    <CustomContextMenu />
                    <BlockInspectAndContext />
                    <Analytics />
                    <SpeedInsights />
                  </ThemeProvider>
                  <Script
                    src="https://s.pageclip.co/v1/pageclip.js"
                    charSet="utf-8"
                    strategy="afterInteractive"
                  ></Script>
                </>
              )}
            </body>
          </MultisessionAppSupport>
        </ClerkProvider>
      </ErrorBoundary>
    </html>
  );
}
