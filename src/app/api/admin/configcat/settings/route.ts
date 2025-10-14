import { createConfigCatClient } from '@/lib/configcat-management';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin API: Get all settings (feature flags) for a config
 * GET /api/admin/configcat/settings?configId=xxx
 *
 * Create a new setting
 * POST /api/admin/configcat/settings
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

    const configId = request.nextUrl.searchParams.get('configId');
    if (!configId) {
      return NextResponse.json({ error: 'Config ID required' }, { status: 400 });
    }

    const apiKey = process.env.CONFIGCAT_MANAGEMENT_AUTH_HEADER;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ConfigCat Management API key not configured' },
        { status: 500 },
      );
    }

    const client = createConfigCatClient(apiKey);
    const settings = await client.getSettings(configId);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching ConfigCat settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { configId, name, key, hint, settingType } = body;

    if (!configId || !name || !key || !settingType) {
      return NextResponse.json(
        { error: 'Missing required fields: configId, name, key, settingType' },
        { status: 400 },
      );
    }

    const apiKey = process.env.CONFIGCAT_MANAGEMENT_AUTH_HEADER;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ConfigCat Management API key not configured' },
        { status: 500 },
      );
    }

    const client = createConfigCatClient(apiKey);
    const setting = await client.createSetting(configId, name, key, hint || '', settingType);

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Error creating ConfigCat setting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create setting' },
      { status: 500 },
    );
  }
}
