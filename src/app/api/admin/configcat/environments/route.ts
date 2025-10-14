import { createConfigCatClient } from '@/lib/configcat-management';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin API: Get environments for a product
 * GET /api/admin/configcat/environments?productId=xxx
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

    const productId = request.nextUrl.searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const apiKey = process.env.CONFIGCAT_MANAGEMENT_AUTH_HEADER;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ConfigCat Management API key not configured' },
        { status: 500 },
      );
    }

    const client = createConfigCatClient(apiKey);
    const environments = await client.getEnvironments(productId);

    return NextResponse.json({ environments });
  } catch (error) {
    console.error('Error fetching ConfigCat environments:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch environments' },
      { status: 500 },
    );
  }
}
