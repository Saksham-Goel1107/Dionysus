import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser as getCurrentUser } from '@clerk/nextjs/server';
import { sendUserBlockedEmail, sendUserUnblockedEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { userId: adminId, sessionClaims } = await auth();
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
    if (!CLERK_SECRET_KEY) throw new Error('Missing Clerk secret key');


    const getRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!getRes.ok) throw new Error(`Failed to fetch Clerk user: ${await getRes.text()}`);

    const userData = await getRes.json();
    const currentMetadata = userData.public_metadata || {};
    const userEmail = userData.email_addresses?.[0]?.email_address;
    const userName = userData.first_name || '';

    let newMetadata = { ...currentMetadata };
    if (isBlocked) {
      newMetadata.isBlocked = true;
    } else {
      newMetadata.isBlocked = false;
    }

    const alreadyBlocked = !!currentMetadata.isBlocked;
    if (isBlocked && alreadyBlocked) {
      if (userEmail) await sendUserBlockedEmail({ to: userEmail, name: userName });
      return NextResponse.json({
        success: true,
        user: { id: userId, isBlocked: true },
        message: 'User is already blocked',
      });
    }
    if (!isBlocked && !alreadyBlocked) {
      if (userEmail) await sendUserUnblockedEmail({ to: userEmail, name: userName });
      return NextResponse.json({
        success: true,
        user: { id: userId, isBlocked: false },
        message: 'User is already unblocked',
      });
    }

    const updateRes = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_metadata: newMetadata }),
    });
    if (!updateRes.ok)
      throw new Error(`Failed to update Clerk metadata: ${await updateRes.text()}`);

    const updatedUser = await updateRes.json();
    const updatedBlockStatus = updatedUser.public_metadata?.isBlocked === true;

    if (userEmail) {
      if (isBlocked) {
        await sendUserBlockedEmail({ to: userEmail, name: userName });
      } else {
        await sendUserUnblockedEmail({ to: userEmail, name: userName });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        isBlocked: updatedBlockStatus,
      },
      action: isBlocked ? 'blocked' : 'unblocked',
    });
  } catch (error) {
    console.error('block-user error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
