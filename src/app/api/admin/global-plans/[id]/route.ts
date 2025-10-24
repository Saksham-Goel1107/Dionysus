import prisma from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
// PATCH - Update global plan (activate/deactivate)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!sessionClaims?.metadata?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      user.emailAddresses[0]?.emailAddress !== process.env.ADMIN_EMAIL ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET ||
      userId !== process.env.ADMIN_USER_ID
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { action, name, description, discount, expiresAt } = await request.json();
    const awaitedParams = await params;
    const planId = awaitedParams.id;

    const globalPlan = await prisma.globalPlan.findUnique({
      where: { id: planId },
    });

    if (!globalPlan) {
      return NextResponse.json({ error: 'Global plan not found' }, { status: 404 });
    }

    if (action === 'update') {
      const updatedPlan = await prisma.globalPlan.update({
        where: { id: planId },
        data: {
          name,
          description,
          discount,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });

      return NextResponse.json({
        globalPlan: updatedPlan,
        message: 'Global plan updated successfully',
      });
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
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!sessionClaims?.metadata?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      user.emailAddresses[0]?.emailAddress !== process.env.ADMIN_EMAIL ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET ||
      userId !== process.env.ADMIN_USER_ID
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
