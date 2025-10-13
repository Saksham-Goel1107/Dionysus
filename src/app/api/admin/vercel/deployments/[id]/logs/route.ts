import { vercelClient } from '@/lib/vercel-client';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin API: Get deployment build logs
 * GET /api/admin/vercel/deployments/[id]/logs
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

    const awaitedParams = await params
    const deploymentId = awaitedParams.id;
    const logs = await vercelClient.getBuildLogs(deploymentId);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch logs' },
      { status: 500 },
    );
  }
}
