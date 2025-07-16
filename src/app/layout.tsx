import '@/styles/globals.css';

import { GeistSans } from 'geist/font/sans';
import { type Metadata } from 'next';
import { headers } from 'next/headers';

import { TRPCReactProvider } from '@/trpc/react';
import { checkAndSyncProStatus } from '@/lib/checkAndSyncProStatus';

import { GoogleOneTap } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { Toaster } from 'sonner';
import Providers from './Providers';
import { ThemeProvider } from './components/theme-provider';
import CookieBanner from './components/CookieBanner';
import MaintenanceScreen from '../components/updates/screen';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';
import CustomContextMenu from '@/components/ui/CustomContextMenu';
import BlockInspectAndContext from '@/components/BlockInspectAndContext';
// import MultisessionAppSupport from './MultiSession';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import Script from 'next/script';
import ClerkProviderWithTheme from './ClerkProviderWithTheme';
import Offline from './offline';

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode; params: { slug: string[] } }>) {
  const { userId } = await auth();

  if (userId) {
    try {
      await checkAndSyncProStatus(userId);
    } catch (error) {
      console.error('Failed to sync pro status', error);
    }
  }

  const headersList = await headers();
  const pathname = headersList.get('x-next-pathname') || '';

  const isMaintenance = process.env.NEXT_PUBLIC_MAINTAINENCE_MODE === 'true';

  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <head>
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ClerkProviderWithTheme>
              {/* <MultisessionAppSupport> */}
              {isMaintenance ? (
                <>
                  <MaintenanceScreen />
                  <BlockInspectAndContext />
                  <CustomContextMenu />
                  <Analytics />
                  <SpeedInsights />
                </>
              ) : (
                <>
                  <GoogleOneTap cancelOnTapOutside={true} itpSupport={true} fedCmSupport={true} />
                  {pathname !== '/rate-limit' &&
                    pathname !== '/block' &&
                    pathname !== '/updates' && <CookieBanner />}
                  <TRPCReactProvider>
                    <Offline>
                      {userId ? <Providers>{children}</Providers> : <>{children}</>}
                    </Offline>
                  </TRPCReactProvider>
                  <Toaster richColors />
                  <ScrollToTopButton />
                  <CustomContextMenu />
                  <BlockInspectAndContext />
                  <Analytics />
                  <SpeedInsights />
                  <Script
                    src="https://s.pageclip.co/v1/pageclip.js"
                    charSet="utf-8"
                    strategy="afterInteractive"
                  ></Script>
                  <Script
                    src="https://cdn.userway.org/widget.js"
                    data-account={process.env.NEXT_PUBLIC_USERWAY_ACCOUNT}
                  ></Script>
                  <Script
                    id="tawkto"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                      __html: `
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src=\`https://embed.tawk.to/${process.env.NEXT_PUBLIC_TAWKTO_ACCOUNT}\`;
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
          `,
                    }}
                  />
                  {userId && (
                    <Script
                      id="userback"
                      strategy="afterInteractive"
                      dangerouslySetInnerHTML={{
                        __html: `
        window.Userback = window.Userback || {};
        Userback.access_token = \`${process.env.NEXT_PUBLIC_USERBACK_ACCESS_TOKEN}\`;
        Userback.widget_settings = {
          help_link: \`/support\`
        };
        (async function() {
          try {
          const res = await fetch('/api/user-info', { credentials: 'include' });
          const user = await res.json();
          Userback.user_data = {
            id: \`${userId}\`, 
            info: {
            name: \`\${user.firstName || user.lastName || user.email || 'User'}\`, 
            email: \`\${user.email || 'user@example.com'}\` 
            }
          };
          } catch (e) {
          Userback.user_data = {
            id: \`${userId}\`, 
            info: {
            name: 'User',
            email: 'user@example.com'
            }
          };
          }
        })();
        (function(d) {
          var s = d.createElement('script');s.async = true;s.src = 'https://static.userback.io/widget/v1.js';(d.head || d.body).appendChild(s);
        })(document);
                    `,
                      }}
                    />
                  )}
                </>
              )}
              {/* </MultisessionAppSupport> */}
            </ClerkProviderWithTheme>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
