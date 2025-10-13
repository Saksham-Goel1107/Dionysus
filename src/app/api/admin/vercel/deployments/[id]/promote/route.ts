import { vercelClient } from '@/lib/vercel-client';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin API: Promote deployment to production
 * POST /api/admin/vercel/deployments/[id]/promote
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
    const deployment = await vercelClient.promoteToProduction(deploymentId);

    return NextResponse.json(deployment);
  } catch (error) {
    console.error('Error promoting to production:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to promote to production' },
      { status: 500 },
    );
  }
}
