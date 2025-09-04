import prisma from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - List all coupons
export async function GET() {
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

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new coupon
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { discount, expiresInMinutes, maxUses = 1 } = body;

    if (!discount || !expiresInMinutes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (discount < 1 || discount > 100) {
      return NextResponse.json({ error: 'Discount must be between 1 and 100' }, { status: 400 });
    }

    // Generate unique coupon code
    const code = generateCouponCode();

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discount,
        expiresAt,
        createdBy: userId,
        maxUses,
      },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
