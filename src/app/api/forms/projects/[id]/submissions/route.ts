import { getFormSubmissions } from '@/lib/firebase-forms';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

    // Verify user owns the project
    const project = await prisma.formProject.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get submissions from Firebase
    const submissions = await getFormSubmissions(projectId, limit);

    // Sort by timestamp (newest first)
    submissions.sort((a, b) => {
      const aTime = a.metadata?.timestamp || 0;
      const bTime = b.metadata?.timestamp || 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      submissions,
      count: submissions.length,
      projectId,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
