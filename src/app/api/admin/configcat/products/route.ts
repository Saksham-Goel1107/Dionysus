import { createConfigCatClient } from '@/lib/configcat-management';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Admin API: Get all products (projects) from ConfigCat
 * GET /api/admin/configcat/products
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

    const apiKey = process.env.CONFIGCAT_MANAGEMENT_AUTH_HEADER;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ConfigCat Management API key not configured' },
        { status: 500 },
      );
    }

    const client = createConfigCatClient(apiKey);
    const products = await client.getProducts();

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching ConfigCat products:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 },
    );
  }
}
