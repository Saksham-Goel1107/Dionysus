'use server';
import prisma from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function generateCouponCode(
  discount: number,
  expiresInMinutes: number = 10,
  maxUses: number = 1,
  bypassSecret?: string,
) {
  if (!bypassSecret || bypassSecret !== process.env.BYPASS_COUPON_SECRET) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    if (!sessionClaims?.metadata?.role)
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    if (
      email !== process.env.ADMIN_EMAIL &&
      userId !== process.env.ADMIN_USER_ID &&
      sessionClaims?.metadata?.role !== `${process.env.ADMIN_SECRET}`
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Generate unique coupon code
    const code = generateUniqueCode();

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discount,
        expiresAt,
        createdBy: 'admin', // Will be replaced with actual userId in API
        maxUses,
      },
    });

    return coupon.code;
  } catch (error) {
    console.error('Error generating coupon:', error);
    throw error;
  }
}

function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function validateCouponCode(code: string, userId?: string) {
  try {
    // Find coupon in database
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return null;
    }

    // Check if coupon is expired
    if (coupon.isExpired || coupon.expiresAt < new Date()) {
      return null;
    }

    // Check if coupon has reached max uses
    if (coupon.currentUses >= coupon.maxUses) {
      return null;
    }

    // Check if user has already used this coupon (if userId provided)
    if (userId) {
      const existingUsage = await prisma.couponUsage.findUnique({
        where: {
          couponId_userId: {
            couponId: coupon.id,
            userId: userId,
          },
        },
      });

      if (existingUsage) {
        return null; // User has already used this coupon
      }
    }

    return {
      discount: coupon.discount,
      couponId: coupon.id,
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return null;
  }
}

export async function applyCouponCode(couponId: string, userId: string) {
  try {
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
      };
    });

    return result;
  } catch (error: any) {
    console.error('Error applying coupon:', error);
    return {
      success: false,
      message: error.message || 'Internal server error',
    };
  }
}
