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
  '/support',
  '/api/recaptcha-verify(.*)',
  '/about(.*)',
  '/status(.*)',
  '/api/uptime',
  '/api/maintenance-info',
  '/cookie-policy(.*)',
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: 'LIVE' }),
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

const automationUserAgents = [
  /python/i,
  /httpx/i,
  /urllib/i,
  /requests/i,
  /wget/i,
  /curl/i,
  /java/i,
  /go-http-client/i,
];

function isAutomatedUserAgent(userAgent: string): boolean {
  return automationUserAgents.some((regex) => regex.test(userAgent));
}

export default clerkMiddleware(async (auth, request) => {
  const { country } = geolocation(request);
  const pathname = request.nextUrl.pathname;
  const isBlockPage = pathname.startsWith('/block') || pathname.startsWith('/blocked');
  const isRateLimitPage = pathname.startsWith('/rate-limit');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '8.8.8.8';
  const userAgent = request.headers.get('user-agent') || '';

  if (isAutomatedUserAgent(userAgent)) {
    return new NextResponse(
      JSON.stringify({
        error: 'Automated tools like Python scripts are not allowed.',
        reason: 'Suspicious User-Agent: ' + userAgent,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (process.env.NODE_ENV === 'production' && process.env.IPREGISTRY_ENABLED === 'true') {
    try {
      const res = await fetch(
        `https://api.ipregistry.co/${ip}?key=${process.env.IPREGISTRY_API_KEY}`,
      );
      const data = await res.json();

      const reasons: string[] = [];

      if (data.security?.is_proxy) reasons.push('Proxy detected');
      if (data.security?.is_tor) reasons.push('Tor network detected');
      if (data.security?.is_vpn) reasons.push('VPN detected');
      if (data.security?.is_crawler) reasons.push('Bot or crawler detected');
      if (data.security?.is_threat) reasons.push('Known threat actor IP');
      if (data.security?.is_relay) reasons.push('Relay/Anonymizer network detected');
      if (data.security?.is_bogon) reasons.push('Bogon IP (non-routable)');
      if (data.security?.is_datacenter) reasons.push('Cloud provider or VM environment');
      if (data.security?.threat_types?.includes('automation'))
        reasons.push('Automation tools detected');
      if (data.company?.type === 'hosting') reasons.push('Hosting provider IP');
      if (data.company?.name?.toLowerCase().includes('aws')) reasons.push('AWS server');
      if (data.company?.domain?.includes('digitalocean')) reasons.push('DigitalOcean server');

      if (reasons.length > 0) {
        return new NextResponse(
          JSON.stringify({
            error: 'Your request has been blocked due to security policy violations.',
            ip,
            reasons,
            suggestions: [
              'Disable VPN or proxy if active',
              'Avoid using Tor or anonymous browsers',
              'Ensure your browser is not flagged as an automation tool',
              'Try using a standard, residential network',
              'If you believe this is a mistake, please Email us: sakshamgoel1107@gmail.com.',
            ],
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
      }
    } catch (error) {
      console.error('IPRegistry error:', error);
    }
  }

  const isApiRoute = pathname.startsWith('/api/') || pathname.startsWith('/trpc/');

  if (isAdminRoute(request)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.redirect(new URL('/sign-in', request.url));

    let userEmail;
    const emailAddresses = Array.isArray(sessionClaims?.email_addresses)
      ? sessionClaims.email_addresses
      : [];
    const primaryEmailAddressId = sessionClaims?.primary_email_address_id || '';
    if (emailAddresses.length > 0 && primaryEmailAddressId) {
      userEmail = emailAddresses.find((email) => email.id === primaryEmailAddressId)?.emailAddress;
    }
    if (!userEmail && emailAddresses.length > 0) {
      userEmail = emailAddresses.find((email) => email.emailAddress === ADMIN_EMAIL)?.emailAddress;
    }
    if (!userEmail && sessionClaims?.email) userEmail = sessionClaims.email;

    if (!sessionClaims?.metadata?.role) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (
      userEmail !== ADMIN_EMAIL &&
      userId !== ADMIN_USER_ID &&
      sessionClaims?.metadata?.role !== `${process.env.ADMIN_SECRET}`
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (isBlockPage && pathname.startsWith('/blocked')) {
    try {
      const { userId } = await auth();
      if (userId) {
        const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
        if (!CLERK_SECRET_KEY) throw new Error('Missing Clerk secret key');
        const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const userData = await res.json();
          const isBlocked = userData.public_metadata?.isBlocked === true;
          if (!isBlocked) {
            const response = NextResponse.redirect(new URL('/', request.url));
            response.cookies.delete('blocked_redirect');
            return response;
          }
        } else {
          console.error('Failed to fetch user data from Clerk API:', res.status, res.statusText);
        }
      }
    } catch (err) {
      console.error('Error checking blocked status on blocked page:', err);
    }
  }
  if (isRateLimitPage && !request.cookies.has('middleware_redirect')) {
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
    } catch {
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

  try {
    const { userId } = await auth();

    if (userId) {
      const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
      if (!CLERK_SECRET_KEY) {
        throw new Error('Missing Clerk secret key');
      }

      const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch Clerk user: ${await res.text()}`);
      }

      const userData = await res.json();
      const isBlocked = userData.public_metadata?.isBlocked === true;

      if (isBlocked && !pathname.startsWith('/blocked')) {
        const hasRedirectCookie = request.cookies.has('blocked_redirect');
        if (!hasRedirectCookie) {
          const response = NextResponse.redirect(new URL('/blocked', request.url));
          response.cookies.set('blocked_redirect', 'true', {
            maxAge: 10,
            httpOnly: true,
            path: '/blocked',
            sameSite: 'strict',
          });
          return response;
        }
      }
    }
  } catch (err) {
    console.error('Middleware error:', err);
  }
  if (!isPublicRoute(request)) {
    await auth.protect();
    const { userId, sessionClaims } = await auth();

    if (userId && !sessionClaims?.metadata?.onboardingComplete && !isOnboardingRoute(request)) {
      if (pathname !== '/sync-user') {
        return NextResponse.redirect(new URL('/sync-user', request.url));
      }
    }

    if (userId && sessionClaims?.metadata?.onboardingComplete && pathname === '/onboarding') {
      const baseUrl = env.NEXT_PUBLIC_BASE_URL;
      return NextResponse.redirect(new URL('/dashboard', baseUrl));
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
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self';",
      "media-src 'self' blob: https://www.w3schools.com https://samplelib.com https://www.videezy.com;",
      "img-src 'self' https: data: blob: https://huggingface.co https://cdn-lfs.huggingface.co https://github.com https://avatars.githubusercontent.com https://nyc.cloud.appwrite.io https://cdn.userway.org https://client.crisp.chat https://crisp.chat;",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://s.pageclip.co https://vercel.live https://*.clerk.dev https://*.clerk.accounts.dev https://cdn.jsdelivr.net https://js.doppler.com https://va.vercel-scripts.com https://js.stripe.com https://*.stripe.com https://huggingface.co https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://www.recaptcha.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://vitals.vercel-insights.com https://speed-insights.vercel.app https://browser.sentry-cdn.com https://accounts.google.com https://github.com https://api.github.com https://cdn.userway.org https://cdn.userway.com https://userway.org https://embed.tawk.to https://static.userback.io https://app.userback.io https://client.crisp.chat https://crisp.chat https://static.hotjar.com https://script.hotjar.com https://us-assets.i.posthog.com https://fpnpmcdn.net;",
      "style-src 'self' 'unsafe-inline' https: https://cdn.userway.org https://cdn.userway.com https://client.crisp.chat https://crisp.chat;",
      "connect-src 'self' https: wss: https://js.doppler.com https://va.vercel-scripts.com https://api.assemblyai.com https://js.stripe.com https://*.stripe.com https://generativelanguage.googleapis.com https://huggingface.co https://api-inference.huggingface.co https://api.github.com https://github.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://www.recaptcha.net https://vitals.vercel-insights.com https://speed-insights.vercel.app https://sentry.io https://api.userback.io https://cdn.userway.org https://cdn.userway.com wss://client.relay.crisp.chat https://ws.hotjar.com https://client.crisp.chat https://crisp.chat https://api.ipregistry.co;",
      "font-src 'self' https: data: https://cdn.userway.org https://cdn.userway.com https://client.crisp.chat https://crisp.chat;",
      "frame-src 'self' https://js.stripe.com https://vercel.live https://*.stripe.com https://www.gstatic.com https://www.google.com https://www.recaptcha.net https://browser.sentry-cdn.com https://accounts.google.com https://github.com https://api.github.com https://app.userback.io https://cdn.userway.org https://cdn.userway.com https://client.crisp.chat https://crisp.chat https://dionysus.crisp.help;",
      "object-src 'none';",
      "frame-ancestors 'self' https://*.crisp.chat;",
      "base-uri 'self';",
      "form-action 'self';",
      'upgrade-insecure-requests;',
    ].join(' '),
  );
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|robots\\.txt|sitemap\\.xml|favicon\\.ico|site\\.webmanifest|manifest\\.json|Flag-India\\.webp|logo\\.png|gemini\\.png|undraw_developer\\.svg|success\\.mp3|public/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
