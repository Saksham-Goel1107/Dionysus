import './src/env.js';
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import("next").NextConfig} */
const baseConfig = {
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'fra.cloud.appwrite.io' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'samplelib.com' },
      { protocol: 'https', hostname: 'www.w3schools.com' },
      { protocol: 'https', hostname: 'www.videezy.com' },
    ],
  },
};

const sentryOptions = {
  org: 'saksham-vj',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  disableLogger: true,
  automaticVercelMonitors: true,
  autoInstrumentServerFunctions: false,
};

const config = withSentryConfig(baseConfig, sentryOptions);

export default config;
