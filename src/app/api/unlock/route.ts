import { NextRequest, NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { currentPassword, newPassword, disable } = await req.json();
    // @ts-ignore
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // @ts-ignore
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: false, error: 'No password set.' }, { status: 400 });
    }
    // @ts-ignore
    const valid = await compare(currentPassword, user.passwordHash);
    console.log('Unlock API:', { currentPassword, hash: user.passwordHash, valid });
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Incorrect current password.' },
        { status: 401 },
      );
    }
    if (disable) {
      // Remove password
      await prisma.user.update({ where: { id: userId }, data: { passwordHash: null } });
      return NextResponse.json({ success: true });
    }
    if (!newPassword && !disable) {
      // Only password check, not update/disable
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
