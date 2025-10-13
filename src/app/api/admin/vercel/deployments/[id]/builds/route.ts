import { vercelClient } from '@/lib/vercel-client';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin API: Get deployment builds
 * GET /api/admin/vercel/deployments/[id]/builds
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
    const builds = await vercelClient.getDeploymentBuilds(deploymentId);

    return NextResponse.json(builds);
  } catch (error) {
    console.error('Error fetching builds:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch builds' },
      { status: 500 },
    );
  }
}
