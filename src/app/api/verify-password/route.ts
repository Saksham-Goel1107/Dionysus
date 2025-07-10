import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptchaJWT, signRecaptchaJWT } from '@/lib/recaptcha-jwt';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, resetRateLimit } from '@/lib/rate-limit';

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
    const { password, unlockToken, rememberMinutes } = await req.json();
    if (unlockToken) {
      const payload = await verifyRecaptchaJWT(unlockToken);
      if (payload && payload.userId === userId && payload.exp && Date.now() < payload.exp * 1000) {
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
          },
          { status: 401 },
        );
      }
    }
    const rateKey = `unlock-attempt:${userId}`;
    const rate = await rateLimit(req, rateKey, {
      limit: 5,
      window: 60 * 60, // 1 hour in seconds
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
        },
        { status: 400 },
      );
    }
    // @ts-ignore
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // @ts-ignore
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'No password set.',
          limit: 5,
          remaining: rate.remaining,
          reset,
        },
        { status: 400 },
      );
    }
    // @ts-ignore
    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect password.',
          limit: 5,
          remaining: rate.remaining - 1,
          reset,
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
