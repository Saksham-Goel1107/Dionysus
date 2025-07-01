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
  '/terms(.*)'
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)', '/sync-user(.*)']);

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({
      mode: 'LIVE', // will block requests. Use "DRY_RUN" to log only
    }),
    detectBot({
      mode: 'LIVE', // will block requests. Use "DRY_RUN" to log only
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc
        'CATEGORY:PREVIEW',
      ],
    }),
    fixedWindow({
      mode: "LIVE",
      window: "60s", 
      max: 10, // Standard limit for most pages
    }),
  ],
});

const notAllowedCountries = ['PK'];

export default clerkMiddleware(async (auth, request) => {
  const { country } = geolocation(request);
  const pathname = request.nextUrl.pathname;
  const isBlockPage = pathname.startsWith('/block');
  const isRateLimitPage = pathname.startsWith('/rate-limit');

  // Check for direct access attempts to protected pages
  if ((isBlockPage || isRateLimitPage) && !request.cookies.has('middleware_redirect')) {
    // Redirect unauthorized direct access to home page
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Apply stricter rate limits for API routes
  const isApiRoute = pathname.startsWith('/api/') || pathname.startsWith('/trpc/');
  const isHighLoadApiRoute = pathname.startsWith('/api/ai-') || 
                          pathname.startsWith('/api/git-') || 
                          pathname.startsWith('/api/create-');
  
  // Default decision from Arcjet
  const decision = await aj.protect(request);
  
  // Apply more specific rate limits for API routes (you'll need to implement this in your backend)
  if (isApiRoute && !isRateLimitPage) {
    // Check if the request has authentication
    let isAuthenticated = false;
    try {
      const { userId } = await auth();
      isAuthenticated = !!userId;
    } catch (e) {
      // User is not authenticated
      isAuthenticated = false;
    }
    
    // Check IP-based rate limiting (you might want to implement this with Redis or similar)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    
    // If it's a high-load API and exceeds limits
    if (isHighLoadApiRoute) {
      // Stricter rate limiting for AI/Git endpoints
      // You can implement a more sophisticated rate limiting here with Redis
      // This is just a placeholder for your implementation
      const rateLimitHeader = request.headers.get('x-ratelimit-remaining');
      if (rateLimitHeader === '0' || decision.isDenied()) {
        const response = NextResponse.redirect(new URL('/rate-limit', request.url));
        response.cookies.set('middleware_redirect', 'true', { 
          maxAge: 10,
          httpOnly: true,
          path: '/rate-limit',
          sameSite: 'strict'
        });
        return response;
      }
    }
  }

  if (decision.isDenied()) {
    // Redirect to a custom rate limit page instead of returning JSON
    if (!isRateLimitPage) {
      const response = NextResponse.redirect(new URL('/rate-limit', request.url));
      // Set cookie to indicate this is a middleware redirect
      response.cookies.set('middleware_redirect', 'true', { 
        maxAge: 10, // Short-lived cookie, just for the redirect
        httpOnly: true,
        path: '/rate-limit',
        sameSite: 'strict'
      });
      return response;
    }
    return NextResponse.next();
  }

  if (country && notAllowedCountries.includes(country)) {
    if (!isBlockPage) {
      const response = NextResponse.redirect(new URL('/block', request.url));
      // Set cookie to indicate this is a middleware redirect
      response.cookies.set('middleware_redirect', 'true', { 
        maxAge: 10, // Short-lived cookie, just for the redirect
        httpOnly: true,
        path: '/block',
        sameSite: 'strict'
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
        sameSite: 'strict'
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
          sameSite: 'strict'
        });
        return response;
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
