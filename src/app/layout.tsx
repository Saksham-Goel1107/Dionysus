import '@/styles/globals.css';

import { GeistSans } from 'geist/font/sans';
import { type Metadata } from 'next';
import { cookies } from 'next/headers';

import { TRPCReactProvider } from '@/trpc/react';

import BlockInspectAndContext from '@/components/BlockInspectAndContext';
import CustomContextMenu from '@/components/ui/CustomContextMenu';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';
import { GoogleOneTap } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import MaintenanceScreen from '../components/updates/screen';
import Providers from './Providers';
import AnnouncementBell from './components/AnnouncementBell';
import { ThemeProvider } from './components/theme-provider';
// import MultisessionAppSupport from './MultiSession';
import FullscreenPrompt from '@/components/FullscreenPrompt';
import GlobalSearch from '@/components/GlobalSearch';
import GlobalAIAssistant from '@/components/GlobalAIAssistant';
import ReleaseNoteModal from '@/components/ReleaseNoteModal';
import ClientOnly from '@/components/ui/ClientOnly';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { getFeatureFlagValue } from '@/lib/configcat';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ConfigCatProvider } from 'configcat-react';
import Head from 'next/head';
import Script from 'next/script';
import ClerkProviderWithTheme from './ClerkProviderWithTheme';
import MobileInfoPrompt from './components/MobileInfoPrompt';
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

async function getMaintenanceMode(): Promise<boolean> {
  try {
    return await getFeatureFlagValue('maintenancemode', false);
  } catch (error) {
    console.error('Failed to get maintenance mode from ConfigCat:', error);
    return false;
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isMaintenance = await getMaintenanceMode();

  const cookieStore = await cookies();
  const maintenanceBypass = cookieStore.get('maintenance_bypass');
  const hasValidBypass = maintenanceBypass?.value === process.env.MAINTENANCE_BYPASS_SECRET;

  const showMaintenance = isMaintenance && !hasValidBypass;

  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <Head>
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://dionysus-gray.vercel.app" />
        <title>Dionysus – Your AI Github Assistant</title>
        <meta name="title" content="Dionysus – Your AI Github Assistant" />
        <meta
          name="description"
          content="Dionysus is your AI-powered GitHub assistant, helping you code smarter and faster. Get instant help, code suggestions, and productivity tools for developers."
        />
        <meta
          name="keywords"
          content="AI, GitHub, assistant, developer tools, productivity, coding, typescript, react, nextjs, trpc, open source, prisma, stripe, saas, automation, chatbot, livekit, cloudinary, tailwindcss, zod, clerk, vercel, stream, web development, frontend, backend, fullstack"
        />
        <meta name="author" content="Saksham Goel" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dionysus-gray.vercel.app" />
        <meta property="og:title" content="Dionysus – Your AI Github Assistant" />
        <meta
          property="og:description"
          content="Dionysus is your AI-powered GitHub assistant, helping you code smarter and faster."
        />
        <meta property="og:image" content="https://dionysus-gray.vercel.app/logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Dionysus – Your AI Github Assistant" />
        <meta property="og:site_name" content="Dionysus" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:see_also" content="https://github.com/Saksham-Goel1107/Dionysus" />
        <meta property="og:updated_time" content="2025-08-11T00:00:00.000Z" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Saksham1199805" />
        <meta name="twitter:creator" content="@Saksham1199805" />
        <meta name="twitter:url" content="https://dionysus-gray.vercel.app" />
        <meta name="twitter:title" content="Dionysus – Your AI Github Assistant" />
        <meta
          name="twitter:description"
          content="Dionysus is your AI-powered GitHub assistant, helping you code smarter and faster."
        />
        <meta name="twitter:image" content="https://dionysus-gray.vercel.app/logo.png" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="slack-app-id" content="" />
        <meta name="linkedin:owner" content="https://www.linkedin.com/in/saksham-goel-88b74b33a" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </Head>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ClientOnly>
              <MobileInfoPrompt />
              <ReleaseNoteModal />
            </ClientOnly>
            <ClerkProviderWithTheme>
              {/* <MultisessionAppSupport> */}
              {showMaintenance ? (
                <>
                  <MaintenanceScreen />
                  <BlockInspectAndContext />
                  <ClientOnly>
                    <CustomContextMenu />
                    <Analytics />
                    <SpeedInsights />
                  </ClientOnly>
                </>
              ) : (
                <>
                  <ConfigCatProvider sdkKey={process.env.CONFIGCAT_SDK_KEY || ''}>
                    <GoogleOneTap cancelOnTapOutside={true} itpSupport={true} fedCmSupport={true} />
                    <TRPCReactProvider>
                      <Offline>
                        <Providers>{children}</Providers>
                      </Offline>
                    </TRPCReactProvider>
                    <ClientOnly>
                      <Toaster richColors />
                      <ScrollToTopButton />
                      <AnnouncementBell />
                      <CustomContextMenu />
                      <BlockInspectAndContext />
                      <Analytics />
                      <SpeedInsights />
                      <FullscreenPrompt />
                      <GlobalSearch />
                      <GlobalAIAssistant />
                    </ClientOnly>
                    <Script
                      src="https://s.pageclip.co/v1/pageclip.js"
                      charSet="utf-8"
                      strategy="afterInteractive"
                    ></Script>
                    {process.env.NODE_ENV === 'production' && (
                      <>
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
                        <Script
                          async
                          src="https://www.googletagmanager.com/gtag/js?id=G-W02TQN9H65"
                        ></Script>
                        <Script
                          id="gtag"
                          strategy="afterInteractive"
                          dangerouslySetInnerHTML={{
                            __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());

                            gtag('config', 'G-W02TQN9H65');
                          `,
                          }}
                        />
                      </>
                    )}
                  </ConfigCatProvider>
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
