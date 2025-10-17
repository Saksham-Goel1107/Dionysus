import { getDopplerClient } from '@/lib/doppler';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - List environments for a project
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

    if (!project) {
      return NextResponse.json({ error: 'Project parameter is required' }, { status: 400 });
    }

    const doppler = getDopplerClient();
    const result = await doppler.listEnvironments(project);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ environments: result.data });
  } catch (error: any) {
    console.error('Error fetching Doppler environments:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new environment
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

    const { project, name, slug } = await request.json();

    if (!project || !name || !slug) {
      return NextResponse.json({ error: 'Project, name, and slug are required' }, { status: 400 });
    }

    const doppler = getDopplerClient();
    const result = await doppler.createEnvironment(project, name, slug);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ environment: result.data });
  } catch (error: any) {
    console.error('Error creating Doppler environment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an environment
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

    const { project, environment } = await request.json();

    if (!project || !environment) {
      return NextResponse.json({ error: 'Project and environment are required' }, { status: 400 });
    }

    const doppler = getDopplerClient();
    const result = await doppler.deleteEnvironment(project, environment);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Environment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting Doppler environment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
