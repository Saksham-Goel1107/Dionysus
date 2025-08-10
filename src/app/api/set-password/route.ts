import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { readReplicaDb } from '@/server/read-replica-db';
import sanitizeHtml from 'sanitize-html';
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { password } = await req.json();
    if (typeof password !== 'string' || password.length > 30) {
      return NextResponse.json({ success: false, error: 'Password too long' }, { status: 400 });
    }
    const sanitizedPassword =
      typeof password === 'string'
        ? sanitizeHtml(password, { allowedTags: [], allowedAttributes: {} }).trim()
        : password;
    if (
      !sanitizedPassword ||
      typeof sanitizedPassword !== 'string' ||
      sanitizedPassword.length < 8
    ) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 400 });
    }
    const hashed = await hash(sanitizedPassword, 12);
    const user = await readReplicaDb.user.findUnique({ where: { id: userId } });
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
