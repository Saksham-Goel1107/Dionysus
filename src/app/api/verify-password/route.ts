import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptchaJWT, signRecaptchaJWT } from '@/lib/recaptcha-jwt';
import { compare } from 'bcryptjs';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, resetRateLimit } from '@/lib/rate-limit';
import { verifyRecaptchaV2 } from '@/lib/recaptcha';
import { readReplicaDb } from '@/server/read-replica-db';

function checkForSuspiciousPatterns(req: NextRequest): boolean {
  try {
    const userAgent = req.headers.get('user-agent') || '';
    const accept = req.headers.get('accept') || '';
    const acceptLanguage = req.headers.get('accept-language') || '';

    if (
      !userAgent ||
      userAgent.includes('bot') ||
      userAgent.includes('curl') ||
      userAgent.includes('python') ||
      userAgent.length < 20
    ) {
      return true;
    }

    if (!accept || !acceptLanguage) {
      return true;
    }

    const hasExpectedHeaders =
      req.headers.has('sec-fetch-site') ||
      req.headers.has('sec-ch-ua') ||
      req.headers.has('sec-fetch-mode');

    if (!hasExpectedHeaders) {
      return true;
    }

    const referer = req.headers.get('referer');
    const origin = req.headers.get('origin');

    if (!referer && !origin) {
      return true;
    }

    if (Math.random() < 0.05) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error in suspicious pattern detection:', error);
    return true;
  }
}

function parseRateLimitMeta(rate: any) {
  let reset = null;
  if (rate && rate.response && typeof rate.response.body === 'object') {
    try {
      const body = rate.response.body;
      if (typeof body === 'string') {
        const parsed = JSON.parse(body);
        reset = parsed.reset;
      } else if (body && typeof body.reset !== 'undefined') {
        reset = body.reset;
      }
    } catch {}
  }
  return reset || Date.now() + 60 * 60 * 1000;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          limit: 5,
          remaining: 0,
          reset: Date.now() + 60 * 60 * 1000,
        },
        { status: 401 },
      );
    }
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing request body',
          limit: 5,
          remaining: 0,
          reset: Date.now() + 60 * 60 * 1000,
        },
        { status: 400 },
      );
    }
    let { password, unlockToken, rememberMinutes, recaptchaToken } = body || {};
    if (typeof password !== 'string' || password.length > 30) {
      return NextResponse.json(
        { success: false, error: 'Password too long or invalid' },
        { status: 400 },
      );
    }
    const sanitizedPassword =
      typeof password === 'string'
        ? (() => {
            let prev, curr = password;
            do {
              prev = curr;
              curr = curr.replace(/<script.*?>.*?<\/script>/gi, '');
            } while (curr !== prev);
            return curr.trim();
          })()
        : password;
    if (
      !sanitizedPassword ||
      typeof sanitizedPassword !== 'string' ||
      sanitizedPassword.length < 8
    ) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 400 });
    }
    if (typeof sanitizedPassword === 'string') password = sanitizedPassword.trim();
    if (typeof unlockToken === 'string') unlockToken = unlockToken.trim();
    if (typeof recaptchaToken === 'string') recaptchaToken = recaptchaToken.trim();
    if (typeof rememberMinutes !== 'number') rememberMinutes = 60;
    if (typeof rememberMinutes === 'number')
      rememberMinutes = Math.max(1, Math.min(1440, rememberMinutes));
    if (unlockToken) {
      const payload = await verifyRecaptchaJWT(unlockToken);

      if (payload && payload.userId === userId && payload.exp && Date.now() < payload.exp * 1000) {
        const suspicious = checkForSuspiciousPatterns(req);

        if (suspicious) {
          if (!recaptchaToken) {
            return NextResponse.json(
              {
                success: false,
                error: 'Security verification required',
                limit: 5,
                remaining: 5,
                reset: Date.now() + 60 * 60 * 1000,
                requireRecaptcha: true,
              },
              { status: 403 },
            );
          }

          const isValidRecaptcha = await verifyRecaptchaV2(recaptchaToken);
          if (!isValidRecaptcha) {
            return NextResponse.json(
              {
                success: false,
                error: 'Security verification failed',
                limit: 5,
                remaining: 5,
                reset: Date.now() + 60 * 60 * 1000,
                requireRecaptcha: true,
              },
              { status: 403 },
            );
          }
        }

        return NextResponse.json({
          success: true,
          limit: 5,
          remaining: 5,
          reset: Date.now() + 60 * 60 * 1000,
        });
      } else {
        const rateKey = `unlock-attempt:${userId}`;
        const rate = await rateLimit(req, rateKey, {
          limit: 5,
          window: 60 * 60,
          errorMessage: 'Too many unlock attempts. Please try again in 1 hour.',
        });
        const reset = parseRateLimitMeta(rate);
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or expired unlock token.',
            limit: 5,
            remaining: rate.remaining,
            reset,
            requireRecaptcha: true,
          },
          { status: 401 },
        );
      }
    }
    const rateKey = `unlock-attempt:${userId}`;
    const rate = await rateLimit(req, rateKey, {
      limit: 5,
      window: 60 * 60,
      errorMessage: 'Too many unlock attempts. Please try again in 1 hour.',
    });
    const reset = parseRateLimitMeta(rate);
    if (!rate.success) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: rate.response.body
            ? JSON.parse(await rate.response.text()).message
            : 'Too many attempts.',
          limit: 5,
          remaining: 0,
          reset,
          requireRecaptcha: true,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid password',
          limit: 5,
          remaining: rate.remaining,
          reset,
          requireRecaptcha: true,
        },
        { status: 400 },
      );
    }

    if (!recaptchaToken || typeof recaptchaToken !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Security verification required',
          limit: 5,
          remaining: rate.remaining,
          reset,
          requireRecaptcha: true,
        },
        { status: 403 },
      );
    }

    const recaptchaValid = await verifyRecaptchaV2(recaptchaToken);

    if (!recaptchaValid) {
      console.warn(`reCAPTCHA verification failed for user ${userId} - Possible attack attempt`);

      const captchaRateKey = `captcha-fail:${userId}`;
      await rateLimit(req, captchaRateKey, {
        limit: 3,
        window: 60 * 60 * 24,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Security verification failed',
          limit: 5,
          remaining: rate.remaining,
          reset,
          requireRecaptcha: true,
        },
        { status: 403 },
      );
    }
    // @ts-ignore
    const user = await readReplicaDb.user.findUnique({ where: { id: userId } });
    // @ts-ignore
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'No password set.',
          limit: 5,
          remaining: rate.remaining,
          reset,
          requireRecaptcha: true,
        },
        { status: 400 },
      );
    }
    // @ts-ignore
    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));

      console.warn(
        `Failed password attempt for user ${userId} from IP ${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'}`,
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect password.',
          limit: 5,
          remaining: rate.remaining - 1,
          reset,
          requireRecaptcha: true,
        },
        { status: 401 },
      );
    }
    await resetRateLimit(rateKey);
    const exp = Math.floor(Date.now() / 1000) + rememberMinutes * 60;
    const issuedUnlockToken = await signRecaptchaJWT({ userId, exp });
    return NextResponse.json({
      success: true,
      unlockToken: issuedUnlockToken,
      limit: 5,
      remaining: 5,
      reset: Date.now() + 60 * 60 * 1000,
    });
  } catch (error) {
    console.error('verify-password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60 * 60 * 1000,
      },
      { status: 500 },
    );
  }
}
