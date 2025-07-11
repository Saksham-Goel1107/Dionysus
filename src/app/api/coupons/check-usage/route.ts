import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { hasUserUsedCoupon } from '@/app/(protected)/billing/appwriteCoupons';

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get coupon IDs from request body
    const { couponIds } = await request.json();
    if (!couponIds || !Array.isArray(couponIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Check usage status for each coupon
    const usageStatus: Record<string, boolean> = {};
    await Promise.all(
      couponIds.map(async (couponId) => {
        const used = await hasUserUsedCoupon(couponId, userId);
        usageStatus[couponId] = used;
      })
    );

    return NextResponse.json({ usageStatus });
  } catch (error) {
    console.error('Error checking coupon usage:', error);
    return NextResponse.json(
      { error: 'Failed to check coupon usage' }, 
      { status: 500 }
    );
  }
}
