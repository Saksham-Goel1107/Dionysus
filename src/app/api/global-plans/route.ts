import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// GET - List active global plans for users
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active global plans that the user hasn't used yet
    const globalPlans = await prisma.globalPlan.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        NOT: {
          usages: {
            some: {
              userId: userId,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        discount: true,
        expiresAt: true,
        _count: {
          select: {
            usages: true,
          },
        },
      },
      orderBy: {
        discount: 'desc', // Show highest discounts first
      },
    });

    return NextResponse.json({ globalPlans });
  } catch (error) {
    console.error('Error fetching global plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
