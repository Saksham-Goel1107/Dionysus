import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth, currentUser as getCurrentUser } from '@clerk/nextjs/server';
import { invalidateUserProStatusCache } from '@/lib/pro-status-helpers';

export async function POST(req: NextRequest) {
  try {
    const { userId: adminId, sessionClaims } = await auth();
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!adminId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const currentClerkUser = await getCurrentUser();
    const email = currentClerkUser?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    if (!sessionClaims?.metadata?.role)
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    if (
      adminId !== process.env.ADMIN_USER_ID ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET ||
      email !== process.env.ADMIN_EMAIL
    ) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, isBlocked } = body;

    if (!userId || typeof isBlocked !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isBlocked: true },
    });

    if (currentUser && currentUser.isBlocked === isBlocked) {
      return NextResponse.json({
        success: true,
        user: { id: currentUser.id, isBlocked: currentUser.isBlocked },
        message: `User is already ${isBlocked ? 'blocked' : 'unblocked'}`,
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked },
    });

    await invalidateUserProStatusCache(userId);

    return NextResponse.json({
      success: true,
      user: { id: updated.id, isBlocked: updated.isBlocked },
    });
  } catch (error: any) {
    console.error('block-user error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
