import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { password } = await req.json();
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 400 });
    }
    const hashed = await hash(password, 12);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: `User not found in database for id: ${userId}` },
        { status: 404 },
      );
    }
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashed },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('set-password error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
