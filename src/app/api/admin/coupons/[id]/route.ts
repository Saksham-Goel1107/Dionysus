import prisma from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH - Update coupon (expire early)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check admin privileges
    if (
      email !== process.env.ADMIN_EMAIL ||
      userId !== process.env.ADMIN_USER_ID ||
      sessionClaims?.metadata?.role !== `${process.env.ADMIN_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'expire') {
      const coupon = await prisma.coupon.update({
        where: { id },
        data: { isExpired: true },
      });

      return NextResponse.json({ coupon });
    }

    if (action === 'reinitialize') {
      // Get the current coupon
      const currentCoupon = await prisma.coupon.findUnique({
        where: { id },
      });

      if (!currentCoupon) {
        return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      }

      // Check if the coupon's expiry time hasn't passed
      if (currentCoupon.expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Cannot reinitialize coupon: expiry time has passed' },
          { status: 400 },
        );
      }

      // Reinitialize the coupon
      const coupon = await prisma.coupon.update({
        where: { id },
        data: {
          isExpired: false,
          // Reset usage tracking if needed
          currentUses: 0,
          isUsed: false,
          usedAt: null,
          usedBy: null,
        },
      });

      // Also clear all usage records for this coupon to allow users to use it again
      await prisma.couponUsage.deleteMany({
        where: { couponId: id },
      });

      return NextResponse.json({ coupon });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete coupon
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check admin privileges
    if (
      email !== process.env.ADMIN_EMAIL ||
      userId !== process.env.ADMIN_USER_ID ||
      sessionClaims?.metadata?.role !== `${process.env.ADMIN_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
