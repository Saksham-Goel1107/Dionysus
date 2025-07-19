import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';
import arcjet, { shield, detectBot, fixedWindow } from '@arcjet/next';
import { env } from '@/env';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/docs(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/api/create(.*)', // for the stream chat initialization
  '/support',
  '/api/recaptcha-verify(.*)',
  '/about(.*)',
  '/status(.*)',
  '/api/uptime',
  '/api/maintenance-info',
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/sentry-example-page(.*)']);

const ADMIN_EMAIL = 'sakshamgoel1107@gmail.com';
const ADMIN_USER_ID = 'user_2yfihsCUpfg5wM2Le7letlXwj2C';

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({
      mode: 'LIVE',
    }),
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
    }),
    fixedWindow({
      mode: 'LIVE',
      window: '60s',
      max: 80,
    }),
  ],
});

const notAllowedCountries = ['PK'];

export default clerkMiddleware(async (auth, request) => {
  const { country } = geolocation(request);
  const pathname = request.nextUrl.pathname;
  const isBlockPage = pathname.startsWith('/block');
  const isRateLimitPage = pathname.startsWith('/rate-limit');

  const isApiRoute = pathname.startsWith('/api/') || pathname.startsWith('/trpc/');

  if (isAdminRoute(request)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    let userEmail = undefined;
    const emailAddresses = Array.isArray(sessionClaims?.email_addresses)
      ? sessionClaims.email_addresses
      : [];
    const primaryEmailAddressId = sessionClaims?.primary_email_address_id || '';
    if (emailAddresses.length > 0 && primaryEmailAddressId) {
      userEmail = emailAddresses.find(
        (email: { id: string; emailAddress: string }) => email.id === primaryEmailAddressId,
      )?.emailAddress;
    }
    if (!userEmail && emailAddresses.length > 0) {
      userEmail = emailAddresses.find(
        (email: { emailAddress: string }) => email.emailAddress === ADMIN_EMAIL,
      )?.emailAddress;
    }
    if (!userEmail && sessionClaims?.email) {
      userEmail = sessionClaims.email;
    }
    if (userEmail !== ADMIN_EMAIL && userId !== ADMIN_USER_ID) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if ((isBlockPage || isRateLimitPage) && !request.cookies.has('middleware_redirect')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const isHighLoadApiRoute =
    pathname.startsWith('/api/ai-') ||
    pathname.startsWith('/api/git-') ||
    pathname.startsWith('/api/create-');

  const decision = await aj.protect(request);

  if (isApiRoute && !isRateLimitPage) {
    let isAuthenticated = false;
    try {
      const { userId } = await auth();
      isAuthenticated = !!userId;
    } catch (e) {
      isAuthenticated = false;
    }

    if (isHighLoadApiRoute) {
      const rateLimitHeader = request.headers.get('x-ratelimit-remaining');
      if (rateLimitHeader === '0' || decision.isDenied()) {
        const response = NextResponse.redirect(new URL('/rate-limit', request.url));
        response.cookies.set('middleware_redirect', 'true', {
          maxAge: 10,
          httpOnly: true,
          path: '/rate-limit',
          sameSite: 'strict',
        });
        return response;
      }
    }
  }

  if (decision.isDenied()) {
    if (!isRateLimitPage) {
      const response = NextResponse.redirect(new URL('/rate-limit', request.url));
      response.cookies.set('middleware_redirect', 'true', {
        maxAge: 60,
        httpOnly: true,
        path: '/rate-limit',
        sameSite: 'strict',
      });
      return response;
    }
    return NextResponse.next();
  }

  if (country && notAllowedCountries.includes(country)) {
    if (!isBlockPage) {
      const response = NextResponse.redirect(new URL('/block', request.url));
      response.cookies.set('middleware_redirect', 'true', {
        maxAge: 60,
        httpOnly: true,
        path: '/block',
        sameSite: 'strict',
      });
      return response;
    }
    return NextResponse.next();
  }

  if (country && !notAllowedCountries.includes(country) && isBlockPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
    const { userId, sessionClaims } = await auth();
    if (userId && !sessionClaims?.metadata?.onboardingComplete && !isOnboardingRoute(request)) {
      const baseUrl = env.NEXT_PUBLIC_BASE_URL;
      if (pathname !== '/onboarding' && pathname !== '/sync-user') {
        const response = NextResponse.redirect(new URL('/onboarding', baseUrl));
        response.cookies.set('middleware_redirect', 'true', {
          maxAge: 10,
          httpOnly: true,
          path: '/onboarding',
          sameSite: 'strict',
        });
        return response;
      }
    }

    if (userId && sessionClaims?.metadata?.onboardingComplete && pathname === '/onboarding') {
      const baseUrl = env.NEXT_PUBLIC_BASE_URL;
      return NextResponse.redirect(new URL('/dashboard', baseUrl));
    }

    if (
      userId &&
      sessionClaims &&
      !sessionClaims?.metadata?.onboardingComplete &&
      !pathname.startsWith('/sync-user') &&
      !pathname.startsWith('/onboarding')
    ) {
      const referer = request.headers.get('referer') || '';
      if (referer.includes('/sign-in') || referer.includes('/sign-up')) {
        const response = NextResponse.redirect(new URL('/sync-user', request.url));
        response.cookies.set('middleware_redirect', 'true', {
          maxAge: 10,
          httpOnly: true,
          path: '/sync-user',
          sameSite: 'strict',
        });
        return response;
      }
    }
  }

  const isRecaptchaVerifyApi = pathname.startsWith('/api/recaptcha-verify');
  const isApiRouteGlobal = pathname.startsWith('/api/');
  const recaptchaFailed = request.cookies.get('recaptcha_failed')?.value === 'true';
  if (recaptchaFailed && isApiRouteGlobal && !isRecaptchaVerifyApi) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Blocked by reCAPTCHA. Please complete the security check.',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self';",
      "media-src 'self' blob: https://www.w3schools.com https://samplelib.com https://www.videezy.com;",
      "img-src 'self' https: data: blob: https://huggingface.co https://cdn-lfs.huggingface.co https://github.com https://avatars.githubusercontent.com https://nyc.cloud.appwrite.io https://cdn.userway.org;",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://s.pageclip.co https://*.clerk.dev https://*.clerk.accounts.dev https://cdn.jsdelivr.net https://js.doppler.com https://va.vercel-scripts.com https://js.stripe.com https://*.stripe.com https://huggingface.co https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://vitals.vercel-insights.com https://speed-insights.vercel.app https://browser.sentry-cdn.com https://accounts.google.com https://github.com https://api.github.com https://cdn.userway.org https://cdn.userway.com https://userway.org https://embed.tawk.to https://static.userback.io https://app.userback.io https://client.crisp.chat https://crisp.chat https://static.hotjar.com https://script.hotjar.com https://us-assets.i.posthog.com;",
      "style-src 'self' 'unsafe-inline' https: https://cdn.userway.org https://cdn.userway.com;",
      "connect-src 'self' https: wss: https://js.doppler.com https://va.vercel-scripts.com https://api.assemblyai.com https://js.stripe.com https://*.stripe.com https://generativelanguage.googleapis.com https://huggingface.co https://api-inference.huggingface.co https://api.github.com https://github.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://vitals.vercel-insights.com https://speed-insights.vercel.app https://sentry.io https://api.userback.io https://cdn.userway.org https://cdn.userway.com wss://client.relay.crisp.chat https://ws.hotjar.com;",
      "font-src 'self' https: data: https://cdn.userway.org https://cdn.userway.com;",
      "frame-src 'self' https://js.stripe.com https://*.stripe.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://browser.sentry-cdn.com https://accounts.google.com https://github.com https://api.github.com https://app.userback.io https://cdn.userway.org https://cdn.userway.com https://client.crisp.chat https://crisp.chat;",
      "object-src 'none';",
      "frame-ancestors 'none';",
      "base-uri 'self';",
      "form-action 'self';",
      'upgrade-insecure-requests;',
    ].join(' '),
  );
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|robots\\.txt|sitemap\\.xml|favicon\\.ico|site\\.webmanifest|manifest\\.json|Flag-India\\.webp|logo\\.png|gemini\\.png|undraw_developer\\.svg|success\\.mp3|public/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
