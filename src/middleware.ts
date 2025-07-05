import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';
import arcjet, { shield, detectBot, fixedWindow } from '@arcjet/next';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/docs(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/api/create(.*)',
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)', '/sync-user(.*)']);

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
      max: 50,
    }),
  ],
});

const notAllowedCountries = ['PK'];

export default clerkMiddleware(async (auth, request) => {
  const { country } = geolocation(request);
  const pathname = request.nextUrl.pathname;
  const isBlockPage = pathname.startsWith('/block');
  const isRateLimitPage = pathname.startsWith('/rate-limit');

  if ((isBlockPage || isRateLimitPage) && !request.cookies.has('middleware_redirect')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const isApiRoute = pathname.startsWith('/api/') || pathname.startsWith('/trpc/');
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

    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

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
        maxAge: 10,
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
        maxAge: 10,
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
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      const response = NextResponse.redirect(new URL('/onboarding', baseUrl));
      response.cookies.set('middleware_redirect', 'true', {
        maxAge: 10,
        httpOnly: true,
        path: '/onboarding',
        sameSite: 'strict',
      });
      return response;
    }

    if (userId && !pathname.startsWith('/sync-user')) {
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

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|robots\\.txt|sitemap\\.xml|favicon\\.ico|site\\.webmanifest|Flag-India\\.webp|logo\\.png|gemini\\.png|undraw_developer\\.svg|success\\.mp3|public/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
