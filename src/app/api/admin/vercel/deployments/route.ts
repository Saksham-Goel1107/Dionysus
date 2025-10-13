import { vercelClient } from '@/lib/vercel-client';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin API: Get all deployments
 * GET /api/admin/vercel/deployments
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const since = searchParams.get('since') ? parseInt(searchParams.get('since')!, 10) : undefined;
    const until = searchParams.get('until') ? parseInt(searchParams.get('until')!, 10) : undefined;
    const state = searchParams.get('state') as
      | 'BUILDING'
      | 'ERROR'
      | 'INITIALIZING'
      | 'QUEUED'
      | 'READY'
      | 'CANCELED'
      | undefined;

    const data = await vercelClient.getDeployments({
      limit,
      since,
      until,
      state,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch deployments' },
      { status: 500 },
    );
  }
}
