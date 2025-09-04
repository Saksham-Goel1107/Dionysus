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

    const planId = params.id;

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

    // Apply the global plan by creating a usage record
    const usage = await prisma.globalPlanUsage.create({
      data: {
        globalPlanId: planId,
        userId,
      },
    });

    return NextResponse.json({
      message: 'Global plan applied successfully',
      discount: globalPlan.discount,
      planName: globalPlan.name,
      usage,
    });
  } catch (error) {
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
