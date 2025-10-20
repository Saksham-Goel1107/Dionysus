import prisma from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - List all global plans
export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!sessionClaims?.metadata?.role) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (
      user?.emailAddresses?.[0]?.emailAddress !== process.env.ADMIN_EMAIL ||
      userId !== process.env.ADMIN_USER_ID ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET
    ) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const globalPlans = await prisma.globalPlan.findMany({
      include: {
        usages: {
          select: {
            id: true,
            userId: true,
            usedAt: true,
          },
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ globalPlans });
  } catch (error) {
    console.error('Error fetching global plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new global plan
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (email !== process.env.ADMIN_EMAIL || userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, discount, expiresAt } = await request.json();

    // Validation
    if (!name || !discount) {
      return NextResponse.json({ error: 'Name and discount are required' }, { status: 400 });
    }

    if (discount < 5 || discount > 90) {
      return NextResponse.json({ error: 'Discount must be between 5% and 90%' }, { status: 400 });
    }

    const globalPlan = await prisma.globalPlan.create({
      data: {
        name,
        description,
        discount: parseInt(discount),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: userId,
      },
    });

    return NextResponse.json({ globalPlan });
  } catch (error) {
    console.error('Error creating global plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
