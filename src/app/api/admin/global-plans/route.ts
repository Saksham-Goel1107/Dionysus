import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - List all global plans
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.emailAddress !== process.env.ADMIN_EMAIL) {
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

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.emailAddress !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
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
