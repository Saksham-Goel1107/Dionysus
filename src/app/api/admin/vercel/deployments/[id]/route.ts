import { vercelClient } from '@/lib/vercel-client';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin API: Get single deployment details
 * GET /api/admin/vercel/deployments/[id]
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    const deployment = await vercelClient.getDeployment(deploymentId);

    return NextResponse.json(deployment);
  } catch (error) {
    console.error('Error fetching deployment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch deployment' },
      { status: 500 },
    );
  }
}

/**
 * Admin API: Delete a deployment
 * DELETE /api/admin/vercel/deployments/[id]
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const result = await vercelClient.deleteDeployment(deploymentId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting deployment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete deployment' },
      { status: 500 },
    );
  }
}
