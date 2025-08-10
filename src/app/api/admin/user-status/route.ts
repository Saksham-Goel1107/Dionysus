import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId: adminId, sessionClaims } = await auth();
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!adminId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const Currentuser = await currentUser();
    const email = Currentuser?.emailAddresses?.[0]?.emailAddress;
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

    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isBlocked: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      isBlocked: user.isBlocked ?? false,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
