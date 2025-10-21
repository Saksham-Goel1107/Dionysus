import { createConfigCatClient } from '@/lib/configcat-management';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin API: Get setting value for an environment
 * GET /api/admin/configcat/settings/[id]/value?environmentId=xxx
 *
 * Update setting value for an environment
 * PUT /api/admin/configcat/settings/[id]/value
 *
 * Delete a setting
 * DELETE /api/admin/configcat/settings/[id]
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

    const awaitedParams = await params;
    const settingId = parseInt(awaitedParams.id);
    const environmentId = request.nextUrl.searchParams.get('environmentId');

    if (!environmentId) {
      return NextResponse.json({ error: 'Environment ID required' }, { status: 400 });
    }

    const apiKey = process.env.CONFIGCAT_MANAGEMENT_AUTH_HEADER;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ConfigCat Management API key not configured' },
        { status: 500 },
      );
    }

    const client = createConfigCatClient(apiKey);
    const value = await client.getSettingValue(environmentId, settingId);

    return NextResponse.json(value);
  } catch (error) {
    console.error('Error fetching setting value:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch setting value' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const awaitedParams = await params;
    const settingId = parseInt(awaitedParams.id);
    const body = await request.json();
    const { environmentId, value } = body;

    if (!environmentId || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: environmentId, value' },
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
    const updatedValue = await client.updateSettingValue(environmentId, settingId, value);

    return NextResponse.json({ value: updatedValue });
  } catch (error) {
    console.error('Error updating setting value:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update setting value' },
      { status: 500 },
    );
  }
}

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

    const awaitedParams = await params;
    const settingId = parseInt(awaitedParams.id);

    const apiKey = process.env.CONFIGCAT_MANAGEMENT_AUTH_HEADER;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ConfigCat Management API key not configured' },
        { status: 500 },
      );
    }

    const client = createConfigCatClient(apiKey);
    await client.deleteSetting(settingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete setting' },
      { status: 500 },
    );
  }
}
