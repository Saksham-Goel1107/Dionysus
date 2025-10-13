import { vercelClient } from '@/lib/vercel-client';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin API: Cancel a deployment
 * POST /api/admin/vercel/deployments/[id]/cancel
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, sessionClaims } = await auth();

    // Check admin authorization
    if (
      !userId ||
      userId !== process.env.ADMIN_USER_ID ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deploymentId = params.id;
    const result = await vercelClient.cancelDeployment(deploymentId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error canceling deployment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel deployment' },
      { status: 500 },
    );
  }
}
