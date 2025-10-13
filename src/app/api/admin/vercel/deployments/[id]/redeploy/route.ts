import { vercelClient } from '@/lib/vercel-client';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin API: Redeploy a deployment
 * POST /api/admin/vercel/deployments/[id]/redeploy
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

    const body = await request.json();
    const deploymentId = params.id;
    const target = body.target as 'production' | 'staging' | undefined;

    const deployment = await vercelClient.redeployDeployment(deploymentId, target);

    return NextResponse.json(deployment);
  } catch (error) {
    console.error('Error redeploying:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to redeploy' },
      { status: 500 },
    );
  }
}
