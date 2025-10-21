import { vercelClient } from '@/lib/vercel-client';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Admin API: Get project domains
 * GET /api/admin/vercel/domains
 */
export async function GET() {
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

    const domains = await vercelClient.getProjectDomains();

    return NextResponse.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch domains' },
      { status: 500 },
    );
  }
}
