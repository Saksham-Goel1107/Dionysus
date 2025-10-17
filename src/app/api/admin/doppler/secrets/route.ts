import { getDopplerClient } from '@/lib/doppler';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - List secrets for a config
export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      user.emailAddresses[0]?.emailAddress !== process.env.ADMIN_EMAIL ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET ||
      userId !== process.env.ADMIN_USER_ID
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    const config = searchParams.get('config');

    if (!project || !config) {
      return NextResponse.json(
        { error: 'Project and config parameters are required' },
        { status: 400 },
      );
    }

    const doppler = getDopplerClient();
    const result = await doppler.listSecrets(project, config, true);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ secrets: result.data });
  } catch (error: any) {
    console.error('Error fetching Doppler secrets:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST - Update or create secret
export async function POST(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      user.emailAddresses[0]?.emailAddress !== process.env.ADMIN_EMAIL ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET ||
      userId !== process.env.ADMIN_USER_ID
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { project, config, name, value, visibility } = await request.json();

    if (!project || !config || !name || value === undefined) {
      return NextResponse.json(
        { error: 'Project, config, name, and value are required' },
        { status: 400 },
      );
    }

    const doppler = getDopplerClient();
    const result = await doppler.updateSecret(project, config, name, value, visibility);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Secret updated successfully' });
  } catch (error: any) {
    console.error('Error updating Doppler secret:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a secret
export async function DELETE(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      user.emailAddresses[0]?.emailAddress !== process.env.ADMIN_EMAIL ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET ||
      userId !== process.env.ADMIN_USER_ID
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { project, config, name } = await request.json();

    if (!project || !config || !name) {
      return NextResponse.json(
        { error: 'Project, config, and name are required' },
        { status: 400 },
      );
    }

    const doppler = getDopplerClient();
    const result = await doppler.deleteSecret(project, config, name);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Secret deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting Doppler secret:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
