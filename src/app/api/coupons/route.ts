import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { api } from '@/trpc/react';
import { 
  getCouponByCode, 
  getAvailableCouponsForUser,
  hasUserUsedCoupon
} from '../../(protected)/billing/appwriteCoupons';

export async function GET() {
  const { data: transactions } = api.project.getMyTransactions.useQuery();
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const createdAt = user.createdAt;
    const has2FA = user.totpEnabled || user.twoFactorEnabled;
    
    let region = '';
    try {
      const email = user.emailAddresses[0]?.emailAddress;
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipRes.json();
      if (ip) {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoRes.json();
        region = geoData.country || '';
      }
    } catch (e) {
      console.error('Error extracting region from email:', e);
    }
    
    
    const purchaseCount = transactions?.length ?? 0;
    
    const coupons = await getAvailableCouponsForUser(userId, {
      has2FA,
      region,
      createdAt: String(createdAt),
      purchaseCount
    });
    
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Error getting available coupons:', error);
    return NextResponse.json(
      { error: 'Failed to get coupons' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }
    
    const coupon = await getCouponByCode(code);
    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 404 });
    }
    
    if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({ error: 'Coupon has reached maximum usage limit' }, { status: 400 });
    }
    
    const hasUsed = await hasUserUsedCoupon(coupon.$id!, userId);
    if (hasUsed) {
      return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true,
      coupon: {
        name: coupon.name,
        code: coupon.code,
        discount: coupon.discount,
        description: coupon.description
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' }, 
      { status: 500 }
    );
  }
}
