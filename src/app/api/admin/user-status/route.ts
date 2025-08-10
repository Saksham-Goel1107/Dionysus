import { NextRequest, NextResponse } from 'next/server';
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

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
    if (!CLERK_SECRET_KEY) throw new Error('Missing Clerk secret key');

    const res = await fetch(`https://api.clerk.com/v1/users/${targetUserId}`, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const userData = await res.json();
    const isBlocked = userData.public_metadata?.isBlocked === true;

    return NextResponse.json({
      success: true,
      isBlocked,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
