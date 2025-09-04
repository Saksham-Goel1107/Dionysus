import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { couponId } = body;

    if (!couponId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Coupon ID is required',
        },
        { status: 400 },
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get current coupon state
      const coupon = await tx.coupon.findUnique({
        where: { id: couponId },
      });

      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Recheck all conditions
      if (coupon.isExpired || coupon.expiresAt < new Date()) {
        throw new Error('Coupon has expired');
      }

      if (coupon.currentUses >= coupon.maxUses) {
        throw new Error('Coupon has been used maximum number of times');
      }

      // Check if user has already used this coupon
      const existingUsage = await tx.couponUsage.findUnique({
        where: {
          couponId_userId: {
            couponId: couponId,
            userId: userId,
          },
        },
      });

      if (existingUsage) {
        throw new Error('You have already used this coupon');
      }

      // Create usage record
      await tx.couponUsage.create({
        data: {
          couponId: couponId,
          userId: userId,
        },
      });

      // Update coupon usage
      const updatedCoupon = await tx.coupon.update({
        where: { id: couponId },
        data: {
          currentUses: { increment: 1 },
          usedAt: new Date(),
          usedBy: userId,
          isUsed: coupon.maxUses === 1, // Mark as used only if it's a single-use coupon
        },
      });

      return {
        success: true,
        discount: updatedCoupon.discount,
        message: 'Coupon applied successfully',
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error applying coupon:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
      },
      { status: 500 },
    );
  }
}
