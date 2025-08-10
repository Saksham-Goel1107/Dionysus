import { NextRequest, NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, resetRateLimit } from '@/lib/rate-limit';
import { verifyRecaptchaV2 } from '@/lib/recaptcha';
import { readReplicaDb } from '@/server/read-replica-db';

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
    const { currentPassword, newPassword, disable, recaptchaToken } = await req.json();
    if (typeof currentPassword !== 'string' && currentPassword.length > 30) {
      return NextResponse.json(
        { success: false, error: 'Invalid current password' },
        { status: 400 },
      );
    }
    if (newPassword && newPassword.length > 30) {
      return NextResponse.json({ success: false, error: 'New password too long' }, { status: 400 });
    }
    function removeAllScriptTags(input: string): string {
      let previous: string;
      do {
        previous = input;
        input = input.replace(/<script.*?>.*?<\/script>/gi, '');
      } while (input !== previous);
      return input.trim();
    }

    const sanitizedNewPassword =
      typeof newPassword === 'string'
        ? removeAllScriptTags(newPassword)
        : newPassword;

    const sanitizedPassword =
      typeof currentPassword === 'string'
        ? removeAllScriptTags(currentPassword)
        : currentPassword;
    if (
      !sanitizedPassword ||
      typeof sanitizedPassword !== 'string' ||
      sanitizedPassword.length < 8
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid current password' },
        { status: 400 },
      );
    }

    // Check for recaptcha token
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

    // Verify recaptcha token
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

    const rateKey = `unlock-attempt:${userId}`;
    const rate = await rateLimit(req, rateKey, {
      limit: 5,
      window: 60 * 60,
      errorMessage: 'Too many unlock attempts. Please try again in 1 hour.',
    });
    if (!rate.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many unlock attempts. Please try again in 1 hour.',
          limit: 5,
          remaining: 0,
          reset: Date.now() + 60 * 60 * 1000,
        },
        { status: 429 },
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
          reset: Date.now() + 60 * 60 * 1000,
        },
        { status: 400 },
      );
    }
    // @ts-ignore
    const valid = await compare(sanitizedPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect current password.',
          limit: 5,
          remaining: rate.remaining - 1,
          reset: Date.now() + 60 * 60 * 1000,
        },
        { status: 401 },
      );
    }
    await resetRateLimit(rateKey);
    if (disable) {
      await prisma.user.update({ where: { id: userId }, data: { passwordHash: null } });
      return NextResponse.json({
        success: true,
        limit: 5,
        remaining: 5,
        reset: Date.now() + 60 * 60 * 1000,
      });
    }
    if (!sanitizedNewPassword && !disable) {
      return NextResponse.json({
        success: true,
        limit: 5,
        remaining: 5,
        reset: Date.now() + 60 * 60 * 1000,
      });
    }
    if (
      sanitizedNewPassword &&
      (typeof sanitizedNewPassword !== 'string' || sanitizedNewPassword.length < 8)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid new password.',
          limit: 5,
          remaining: rate.remaining,
          reset: Date.now() + 60 * 60 * 1000,
        },
        { status: 400 },
      );
    }
    // HaveIBeenPwned password check
    if (sanitizedNewPassword) {
      const sha1 = await import('crypto').then((c) =>
        c.createHash('sha1').update(sanitizedNewPassword).digest('hex').toUpperCase(),
      );
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);
      const hibpRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!hibpRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: 'Could not check password security.',
            limit: 5,
            remaining: rate.remaining,
            reset: Date.now() + 60 * 60 * 1000,
          },
          { status: 500 },
        );
      }
      const hibpText = await hibpRes.text();
      const found = hibpText.split('\n').some((line) => line.startsWith(suffix));
      if (found) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This password has been found in a data breach. Please choose a more secure password.',
            limit: 5,
            remaining: rate.remaining,
            reset: Date.now() + 60 * 60 * 1000,
          },
          { status: 400 },
        );
      }
      const hashed = await hash(sanitizedNewPassword, 12);
      await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashed } });
      return NextResponse.json({
        success: true,
        limit: 5,
        remaining: 5,
        reset: Date.now() + 60 * 60 * 1000,
      });
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request.',
        limit: 5,
        remaining: rate.remaining,
        reset: Date.now() + 60 * 60 * 1000,
      },
      { status: 400 },
    );
  } catch (error) {
    console.error('unlock error:', error);
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
