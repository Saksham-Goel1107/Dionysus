import { getDopplerClient } from '@/lib/doppler';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// GET - List all Doppler projects
export async function GET() {
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

    const doppler = getDopplerClient();
    const result = await doppler.listProjects();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ projects: result.data });
  } catch (error: any) {
    console.error('Error fetching Doppler projects:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new Doppler project
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

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const doppler = getDopplerClient();
    const result = await doppler.createProject(name, description);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ project: result.data });
  } catch (error: any) {
    console.error('Error creating Doppler project:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
