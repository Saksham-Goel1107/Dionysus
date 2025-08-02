import '@/styles/globals.css';

import { GeistSans } from 'geist/font/sans';
import { type Metadata } from 'next';
import { headers } from 'next/headers';

import { TRPCReactProvider } from '@/trpc/react';

import { GoogleOneTap } from '@clerk/nextjs';
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
import ClientOnly from '@/components/ui/ClientOnly';
import Offline from './offline';
import Head from 'next/head';
import IdleTimeout from '@/app/components/IdleTimeout';

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
  const headersList = await headers();
  const pathname = headersList.get('x-next-pathname') || '';

  const isMaintenance = process.env.NEXT_PUBLIC_MAINTAINENCE_MODE === 'true';

  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <Head>
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body>
        <IdleTimeout />
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ClerkProviderWithTheme>
              {/* <MultisessionAppSupport> */}
              {isMaintenance ? (
                <>
                  <MaintenanceScreen />
                  <BlockInspectAndContext />
                  <ClientOnly>
                    <CustomContextMenu />
                  </ClientOnly>
                  <Analytics />
                  <SpeedInsights />
                </>
              ) : (
                <>
                  <GoogleOneTap cancelOnTapOutside={true} itpSupport={true} fedCmSupport={true} />
                  <TRPCReactProvider>
                    <Offline>
                      <Providers>{children}</Providers>
                    </Offline>
                  </TRPCReactProvider>
                  <Toaster richColors />
                  <ScrollToTopButton />
                  <ClientOnly>
                    <CustomContextMenu />
                  </ClientOnly>
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
                    id="crisp-chat"
                    type="text/javascript"
                    strategy="afterInteractive"
                    data-magic-browse="true"
                    dangerouslySetInnerHTML={{
                      __html: `
                        window.$crisp = [];
                        window.CRISP_WEBSITE_ID = \`${process.env.NEXT_PUBLIC_CRISP_TOKEN}\`;
                        window.$crisp.push(["safe", true]);
                        (function(){
                          var d = document, s = d.createElement("script");
                          s.src = "https://client.crisp.chat/l.js";
                          s.async = 1;
                          d.getElementsByTagName("head")[0].appendChild(s);
                        })();
                      `,
                    }}
                  />
                  <Script
                    id="hotjar"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                      __html: `
      (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:6468665,hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `,
                    }}
                  />
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
