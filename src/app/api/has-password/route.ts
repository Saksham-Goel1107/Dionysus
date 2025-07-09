import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ hasPassword: false });
    // @ts-ignore
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // @ts-ignore
    return NextResponse.json({ hasPassword: !!user?.passwordHash });
  } catch {
    return NextResponse.json({ hasPassword: false });
  }
}
