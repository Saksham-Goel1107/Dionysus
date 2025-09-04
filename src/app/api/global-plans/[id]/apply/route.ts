import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Apply a global plan
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const awaitedParams = await params;
    const planId = awaitedParams.id;

    // Check if global plan exists and is active
    const globalPlan = await prisma.globalPlan.findUnique({
      where: { id: planId },
      include: {
        usages: {
          where: { userId },
        },
      },
    });

    if (!globalPlan) {
      return NextResponse.json({ error: 'Global plan not found' }, { status: 404 });
    }

    if (!globalPlan.isActive) {
      return NextResponse.json({ error: 'Global plan is not active' }, { status: 400 });
    }

    // Check if plan has expired
    if (globalPlan.expiresAt && new Date(globalPlan.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Global plan has expired' }, { status: 400 });
    }

    // Check if user has already used this plan
    if (globalPlan.usages.length > 0) {
      return NextResponse.json(
        { error: 'You have already used this global plan' },
        { status: 400 },
      );
    }

    // Return global plan details without creating usage record
    return NextResponse.json({
      message: 'Global plan validated successfully',
      discount: globalPlan.discount,
      planName: globalPlan.name,
      planId: globalPlan.id,
    });
  } catch (error: any) {
    console.error('Error applying global plan:', error);

    // Handle unique constraint violation (user already used this plan)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already used this global plan' },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
