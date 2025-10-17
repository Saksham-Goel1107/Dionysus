import { getDopplerClient } from '@/lib/doppler';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - List configs for a project
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
    const environment = searchParams.get('environment');

    if (!project) {
      return NextResponse.json({ error: 'Project parameter is required' }, { status: 400 });
    }

    const doppler = getDopplerClient();
    const result = await doppler.listConfigs(project, environment || undefined);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ configs: result.data });
  } catch (error: any) {
    console.error('Error fetching Doppler configs:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
