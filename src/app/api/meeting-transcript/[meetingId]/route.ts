import { db } from '@/server/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const paramsParser = z.object({
  meetingId: z.string(),
});

// Define the interface for the meeting with transcript and project
interface MeetingWithTranscript {
  transcript: string | null;
  name: string;
  project: {
    userToProjects: {
      userId: string;
    }[];
  };
}

// Helper function to get meeting with transcript for a user
async function getMeetingWithTranscript(
  meetingId: string,
  userId: string,
): Promise<MeetingWithTranscript | null> {
  // Use raw query to overcome type issues
  const meeting = await db.$queryRaw`
    SELECT m.transcript, m.name, 
    (SELECT COUNT(*) FROM "UserToProject" utp 
      WHERE utp."projectId" = m."projectId" AND utp."userId" = ${userId}) as has_access
    FROM "Meeting" m
    WHERE m.id = ${meetingId}
  `;

  // Process result into correct shape
  if (!meeting || !Array.isArray(meeting) || meeting.length === 0) {
    return null;
  }

  const result = meeting[0] as any;
  return {
    transcript: result.transcript,
    name: result.name,
    project: {
      userToProjects: result.has_access > 0 ? [{ userId }] : [],
    },
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> | { meetingId: string } },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await Promise.resolve(params);
    const { meetingId } = paramsParser.parse(resolvedParams);

    // Fetch the meeting transcript with our helper function
    const meeting = await getMeetingWithTranscript(meetingId, userId);

    // Check if meeting exists
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user has access to this meeting
    if (meeting.project.userToProjects.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if transcript exists
    if (!meeting.transcript) {
      return NextResponse.json({ error: 'Transcript not available' }, { status: 404 });
    }

    return NextResponse.json(
      {
        transcript: meeting.transcript,
        name: meeting.name,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching meeting transcript:', error);
    return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 });
  }
}

// Endpoint for downloading the transcript as a text file
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> | { meetingId: string } },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await Promise.resolve(params);
    const { meetingId } = paramsParser.parse(resolvedParams);

    // Fetch the meeting transcript with our helper function
    const meeting = await getMeetingWithTranscript(meetingId, userId);

    // Check if meeting exists
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user has access to this meeting
    if (meeting.project.userToProjects.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if transcript exists
    if (!meeting.transcript) {
      return NextResponse.json({ error: 'Transcript not available' }, { status: 404 });
    }

    // Return the transcript as a downloadable file
    const fileName = `${meeting.name.replace(/\s+/g, '_')}_transcript.txt`;

    // Create a response with the transcript as plain text
    const response = new NextResponse(meeting.transcript, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error downloading meeting transcript:', error);
    return NextResponse.json({ error: 'Failed to download transcript' }, { status: 500 });
  }
}
