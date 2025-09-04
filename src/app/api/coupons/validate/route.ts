import prisma from '@/lib/prisma';
import { getRedisClient } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    // Rate limiting
    try {
      const redis = await getRedisClient();
      const key = `coupon:validate:${userId || 'anon'}`;
      const maxReq = 10;
      const windowSec = 60 * 60; // 1 hour

      const reqCount = await redis.incr(key);
      if (reqCount === 1) {
        await redis.expire(key, windowSec);
      }
      if (reqCount > maxReq) {
        return NextResponse.json(
          {
            success: false,
            message: 'Rate limit exceeded',
          },
          { status: 429 },
        );
      }
    } catch (error) {
      console.warn('Redis error in coupon validation, continuing without rate limiting:', error);
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: 'Coupon code is required',
        },
        { status: 400 },
      );
    }

    // Find coupon in database
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({
        success: false,
        message: 'Invalid coupon code',
      });
    }

    // Check if coupon is expired
    if (coupon.isExpired || coupon.expiresAt < new Date()) {
      return NextResponse.json({
        success: false,
        message: 'Coupon has expired',
      });
    }

    // Check if coupon has reached max uses
    if (coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({
        success: false,
        message: 'Coupon has been used maximum number of times',
      });
    }

    // Check if user has already used this coupon
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
        return NextResponse.json({
          success: false,
          message: 'You have already used this coupon',
        });
      }
    }

    return NextResponse.json({
      success: true,
      discount: coupon.discount,
      couponId: coupon.id,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
