import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH - Update global plan (activate/deactivate)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { action } = await request.json();
    const awaitedParams = await params;
    const planId = awaitedParams.id;

    const globalPlan = await prisma.globalPlan.findUnique({
      where: { id: planId },
    });

    if (!globalPlan) {
      return NextResponse.json({ error: 'Global plan not found' }, { status: 404 });
    }

    if (action === 'toggle') {
      const updatedPlan = await prisma.globalPlan.update({
        where: { id: planId },
        data: {
          isActive: !globalPlan.isActive,
        },
      });

      return NextResponse.json({
        globalPlan: updatedPlan,
        message: `Global plan ${updatedPlan.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    }

    if (action === 'reset') {
      // Delete all usage records to allow everyone to use it again
      await prisma.globalPlanUsage.deleteMany({
        where: { globalPlanId: planId },
      });

      return NextResponse.json({
        message: 'Global plan usage reset successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating global plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete global plan
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const planId = params.id;

    const globalPlan = await prisma.globalPlan.findUnique({
      where: { id: planId },
    });

    if (!globalPlan) {
      return NextResponse.json({ error: 'Global plan not found' }, { status: 404 });
    }

    await prisma.globalPlan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ message: 'Global plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting global plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
