import { NextRequest, NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { currentPassword, newPassword, disable } = await req.json();
    const rateKey = `unlock-attempt:${userId}`;
    const rate = await rateLimit(req, rateKey, {
      limit: 5,
      window: 60 * 60,
      errorMessage: 'Too many unlock attempts. Please try again in 1 hour.',
    });
    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: 'Too many unlock attempts. Please try again in 1 hour.' },
        { status: 429 },
      );
    }
    // @ts-ignore
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // @ts-ignore
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: false, error: 'No password set.' }, { status: 400 });
    }
    // @ts-ignore
    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Incorrect current password.' },
        { status: 401 },
      );
    }
    await resetRateLimit(rateKey);
    if (disable) {
      await prisma.user.update({ where: { id: userId }, data: { passwordHash: null } });
      return NextResponse.json({ success: true });
    }
    if (!newPassword && !disable) {
      return NextResponse.json({ success: true });
    }
    if (newPassword && (typeof newPassword !== 'string' || newPassword.length < 8)) {
      return NextResponse.json({ success: false, error: 'Invalid new password.' }, { status: 400 });
    }
    if (newPassword) {
      const hashed = await hash(newPassword, 12);
      await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashed } });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  } catch (error) {
    console.error('unlock error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
