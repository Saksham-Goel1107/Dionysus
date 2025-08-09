// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://106d6fed8eb9d133b6a2749ae7674ab9@o4509645375733760.ingest.de.sentry.io/4509645377175632',
    integrations: [Sentry.replayIntegration()],
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
  });
}

export const onRouterTransitionStart =
  process.env.NODE_ENV === 'production' ? Sentry.captureRouterTransitionStart : () => {};

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '', {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? '',
  defaults: '2025-05-24',
});
