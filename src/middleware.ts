import arcjet, { detectBot, fixedWindow, shield } from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { geolocation } from '@vercel/functions';
import { NextResponse } from 'next/server';

function createBlockedOverlay(
  reason: string,
  details?: string[],
  options?: { showSignOut?: boolean },
) {
  return `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Access Restricted - Dionysus</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      -webkit-font-smoothing: antialiased;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      z-index: 999999;
      animation: fadeIn 0.4s ease-out forwards;
      overflow-y: auto;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    .card {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      padding: 2.5rem;
      max-width: 600px;
      width: 90%;
      text-align: center;
      backdrop-filter: blur(24px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.45s ease-out;
      margin: auto;
      min-height: fit-content;
      max-height: 90vh;
      overflow-y: auto;
    }

    @keyframes slideUp {
      from { transform: translateY(24px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .icon {
      font-size: 3.2rem;
      margin-bottom: 1.2rem;
      color: #ef4444;
      text-shadow: 0 0 16px rgba(239, 68, 68, 0.5);
    }

    .title {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 1rem;
      background: linear-gradient(45deg, #f43f5e, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .message {
      font-size: 1.1rem;
      margin-bottom: 1.8rem;
      opacity: 0.95;
      line-height: 1.6;
      color: #e2e8f0;
    }

    .details {
      background: rgba(15, 23, 42, 0.55);
      border-radius: 12px;
      padding: 1.4rem;
      margin: 1.8rem 0;
      text-align: left;
      border: 1px solid rgba(251, 191, 36, 0.3);
    }

    .details h3 {
      color: #fbbf24;
      margin-bottom: 0.8rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .details ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .details li {
      padding: 0.55rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .details li:last-child { border-bottom: none; }
    .details li::before { content: "⚠️"; flex-shrink: 0; }

    .contact {
      background: rgba(37, 99, 235, 0.15);
      border: 1px solid rgba(37, 99, 235, 0.3);
      border-radius: 12px;
      padding: 1.2rem;
      margin-top: 1.5rem;
      font-size: 0.95rem;
    }

    .contact a {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
    }

    .contact a:hover { text-decoration: underline; }

    .actions {
      display: flex;
      gap: 14px;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 1.8rem;
    }

    .retry-btn {
      border: none;
      color: white;
      padding: 0.9rem 1.6rem;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .retry-btn.primary {
      background: linear-gradient(45deg, #3b82f6, #6366f1);
      box-shadow: 0 6px 18px rgba(59, 130, 246, 0.35);
    }

    .retry-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(59, 130, 246, 0.5);
    }

    .retry-btn.secondary {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .retry-btn.secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    @media (max-width: 768px) {
      .card { padding: 2rem 1.5rem; }
      .title { font-size: 1.9rem; }
      .message { font-size: 1rem; }
    }
  </style>
</head>
<body>
  <div class="overlay">
    <div class="card">
      <div class="icon">🚫</div>
      <h1 class="title">Access Restricted</h1>
      <p class="message">${reason}</p>

      ${
        details && details.length > 0
          ? `
        <div class="details">
          <h3>Security Issues Detected:</h3>
          <ul>
            ${details.map((detail) => `<li>${detail}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      <div class="contact">
        <p><strong>Need Help?</strong></p>
        <p>If you believe this is an error, please contact support:</p>
        <p><a href="mailto:sakshamgoel1107@gmail.com">sakshamgoel1107@gmail.com</a></p>
      </div>

      <div class="actions">
        <button class="retry-btn primary" onclick="window.location.reload()">🔄 Try Again</button>
        ${options?.showSignOut ? `<a class="retry-btn secondary" href="/sign-out" style="text-decoration:none;display:inline-block;text-align:center;">🔓 Sign out</a>` : ''}
      </div>
    </div>
  </div>
</body>
</html>

  `;
}

// Function to create rate limit overlay HTML
function createRateLimitOverlay() {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rate Limited - Dionysus</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(18px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      z-index: 999999;
      animation: fadeIn 0.4s ease-out forwards;
      overflow-y: auto;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.96);}
      to { opacity: 1; transform: scale(1);}
    }
    .card {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.13);
      border-radius: 18px;
      padding: 2.5rem 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      backdrop-filter: blur(22px);
      box-shadow: 0 16px 40px rgba(0,0,0,0.45);
      margin: auto;
      min-height: fit-content;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.45s ease-out;
    }
    @keyframes slideUp {
      from { transform: translateY(24px); opacity: 0;}
      to { transform: translateY(0); opacity: 1;}
    }
    .icon {
      font-size: 3.1rem;
      margin-bottom: 1.1rem;
      color: #fbbf24;
      text-shadow: 0 0 12px rgba(251,191,36,0.45);
      animation: bounce 1.4s infinite;
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0);}
      40% { transform: translateY(-12px);}
      60% { transform: translateY(-5px);}
    }
    .title {
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 0.7rem;
      background: linear-gradient(45deg, #facc15, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .message {
      font-size: 1.08rem;
      margin-bottom: 1.7rem;
      opacity: 0.93;
      line-height: 1.6;
      color: #e2e8f0;
    }
    .timer {
      background: rgba(0,0,0,0.32);
      border-radius: 12px;
      padding: 1.1rem 1rem;
      margin: 1.4rem 0 1.8rem 0;
      font-size: 1.01rem;
      font-weight: 500;
      border: 1px solid rgba(251,191,36,0.23);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
    }
    .countdown {
      font-size: 2rem;
      color: #facc15;
      font-weight: 700;
      text-shadow: 0 0 8px rgba(251,191,36,0.5);
      letter-spacing: 1px;
      margin-top: 0.2rem;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      align-items: center;
      margin-top: 1.2rem;
      flex-wrap: wrap;
    }
    .retry-btn {
      border: none;
      color: white;
      padding: 0.85rem 1.5rem;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.22s ease;
      background: linear-gradient(45deg, #3b82f6, #6366f1);
      box-shadow: 0 6px 18px rgba(59,130,246,0.28);
    }
    .retry-btn:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 10px 24px rgba(59,130,246,0.38);
    }
    .support {
      margin-top: 1.7rem;
      font-size: 0.97rem;
      background: rgba(37,99,235,0.13);
      border-radius: 10px;
      padding: 1rem;
      border: 1px solid rgba(37,99,235,0.18);
    }
    .support a {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
    }
    .support a:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      .card { padding: 1.5rem 0.7rem; }
      .title { font-size: 1.4rem;}
      .message { font-size: 0.97rem;}
      .countdown { font-size: 1.3rem;}
    }
  </style>
</head>
<body>
  <div class="overlay">
    <div class="card">
      <div class="icon">⏰</div>
      <h1 class="title">Rate Limited</h1>
      <p class="message">You're making requests too quickly.<br>Please slow down to continue.</p>
      <div class="timer">
        <span>Please wait:</span>
        <span class="countdown" id="countdown">60</span> seconds
      </div>
      <div class="actions">
        <button class="retry-btn" onclick="window.location.reload()">🔄 Try Again</button>
      </div>
      <div class="support">
        <strong>Need Help?</strong>
        <br>
        Contact support: <a href="mailto:sakshamgoel1107@gmail.com">sakshamgoel1107@gmail.com</a>
      </div>
    </div>
  </div>
  <script>
    let timeLeft = 60;
    const countdown = document.getElementById('countdown');
    const timer = setInterval(() => {
      timeLeft--;
      countdown.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 1000);
  </script>
</body>
</html>
  `;
}

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
  '/client-version.json',
  '/waitlist(.*)',
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
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '8.8.8.8';
  const userAgent = request.headers.get('user-agent') || '';
  if (process.env.NODE_ENV === 'production') {
    console.log('User IP:', ip);

    if (isAutomatedUserAgent(userAgent)) {
      return new NextResponse(
        createBlockedOverlay(
          'Automated tools and scripts are not allowed to access this service.',
          [`Suspicious User-Agent detected: ${userAgent}`, 'Please use a standard web browser'],
        ),
        {
          status: 403,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    if (process.env.IPREGISTRY_ENABLED === 'true') {
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
            createBlockedOverlay(
              'Your request has been blocked due to security policy violations.',
              [
                ...reasons,
                'Suggestions:',
                '• Disable VPN or proxy if active',
                '• Avoid using Tor or anonymous browsers',
                '• Ensure your browser is not flagged as an automation tool',
                '• Try using a standard, residential network',
              ],
            ),
            {
              status: 403,
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store',
              },
            },
          );
        }
      } catch (error) {
        console.error('IPRegistry error:', error);
      }
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

  const isHighLoadApiRoute =
    pathname.startsWith('/api/ai-') ||
    pathname.startsWith('/api/git-') ||
    pathname.startsWith('/api/create-');

  const decision = await aj.protect(request);

  if (isApiRoute && !pathname.startsWith('/api/uptime')) {
    if (isHighLoadApiRoute) {
      const rateLimitHeader = request.headers.get('x-ratelimit-remaining');
      if (rateLimitHeader === '0' || decision.isDenied()) {
        return new NextResponse(createRateLimitOverlay(), {
          status: 429,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store',
            'Retry-After': '60',
          },
        });
      }
    }
  }

  if (decision.isDenied() && !pathname.startsWith('/api/uptime')) {
    return new NextResponse(createRateLimitOverlay(), {
      status: 429,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
        'Retry-After': '60',
      },
    });
  }

  if (country && notAllowedCountries.includes(country)) {
    return new NextResponse(
      createBlockedOverlay(`Access from ${country} is currently restricted.`, [
        'This service is not available in your region',
        'Please contact support if you need assistance',
      ]),
      {
        status: 403,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store',
        },
      },
    );
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

      if (isBlocked) {
        return new NextResponse(
          createBlockedOverlay(
            'Your account has been temporarily suspended.',
            [
              'Your account access has been restricted',
              'This may be due to terms of service violations',
              'Contact support for account restoration',
            ],
            { showSignOut: true },
          ),
          {
            status: 403,
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store',
            },
          },
        );
      }
    }
  } catch (err) {
    console.error('Middleware error:', err);
  }
  if (!isPublicRoute(request)) {
    try {
      await auth.protect();
      const { userId, sessionClaims } = await auth();

      if (userId && !sessionClaims?.metadata?.onboardingComplete && !isOnboardingRoute(request)) {
        if (pathname !== '/sync-user') {
          return NextResponse.redirect(new URL('/sync-user', request.url));
        }
      }

      if (userId && sessionClaims?.metadata?.onboardingComplete && pathname === '/onboarding') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (authError) {
      console.error('Auth error in middleware:', authError);
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  const isRecaptchaVerifyApi = pathname.startsWith('/api/recaptcha-verify');
  const isApiRouteGlobal = pathname.startsWith('/api/');
  const recaptchaFailed = request.cookies.get('recaptcha_failed')?.value === 'true';
  if (recaptchaFailed && isApiRouteGlobal && !isRecaptchaVerifyApi) {
    return new NextResponse(
      createBlockedOverlay('Security verification required.', [
        'reCAPTCHA verification failed',
        'Please complete the security check to continue',
        'Refresh the page to try again',
      ]),
      {
        status: 403,
        headers: {
          'Content-Type': 'text/html',
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
      "img-src 'self' https: data: blob: https://huggingface.co https://cdn-lfs.huggingface.co https://github.com https://avatars.githubusercontent.com https://nyc.cloud.appwrite.io https://cdn.userway.org https://client.crisp.chat https://crisp.chat;",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://s.pageclip.co https://cse.google.com https://vercel.live https://*.clerk.dev https://*.clerk.accounts.dev https://cdn.jsdelivr.net https://js.doppler.com https://va.vercel-scripts.com https://js.stripe.com https://*.stripe.com https://huggingface.co https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://www.recaptcha.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://vitals.vercel-insights.com https://speed-insights.vercel.app https://browser.sentry-cdn.com https://accounts.google.com https://github.com https://api.github.com https://cdn.userway.org https://cdn.userway.com https://userway.org https://embed.tawk.to https://static.userback.io https://app.userback.io https://client.crisp.chat https://crisp.chat https://static.hotjar.com https://script.hotjar.com https://us-assets.i.posthog.com https://fpnpmcdn.net;",
      "style-src 'self' 'unsafe-inline' https: https://cdn.userway.org https://cdn.userway.com https://client.crisp.chat https://crisp.chat;",
      "connect-src 'self' https: wss: https://js.doppler.com https://va.vercel-scripts.com https://api.assemblyai.com https://js.stripe.com https://*.stripe.com https://generativelanguage.googleapis.com https://huggingface.co https://api-inference.huggingface.co https://api.github.com https://github.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://www.recaptcha.net https://vitals.vercel-insights.com https://speed-insights.vercel.app https://sentry.io https://api.userback.io https://cdn.userway.org https://cdn.userway.com wss://client.relay.crisp.chat https://ws.hotjar.com https://client.crisp.chat https://crisp.chat https://api.ipregistry.co;",
      "font-src 'self' https: data: https://cdn.userway.org https://cdn.userway.com https://client.crisp.chat https://crisp.chat;",
      "frame-src 'self' https://js.stripe.com https://vercel.live https://*.stripe.com https://www.gstatic.com https://www.google.com https://www.recaptcha.net https://browser.sentry-cdn.com https://accounts.google.com https://github.com https://api.github.com https://app.userback.io https://cdn.userway.org https://cdn.userway.com https://client.crisp.chat https://crisp.chat https://dionysus.crisp.help;",
      "worker-src 'self' blob: data:;",
      "object-src 'none';",
      "frame-ancestors 'self' https://*.crisp.chat;",
      "base-uri 'self';",
      "form-action 'self' https://send.pageclip.co;",
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
