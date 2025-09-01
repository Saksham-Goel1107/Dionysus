import { db } from '@/server/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const paramsParser = z.object({
  meetingId: z.string(),
});

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

    // Check if user has access to this meeting
    const meeting = await db.meeting.findFirst({
      where: {
        id: meetingId,
        project: {
          userToProjects: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        issues: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found or unauthorized' }, { status: 404 });
    }

    // If already completed, return current status
    if (meeting.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        hasTranscript: !!meeting.transcript,
        issuesCount: meeting.issues.length,
        message: 'Meeting already completed',
      });
    }

    // If still processing, try to re-trigger the processing
    if (meeting.status === 'PROCESSING') {
      try {
        // Re-trigger the processing by calling the process-meeting endpoint
        const processResponse = await fetch(`${req.nextUrl.origin}/api/process-meeting`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: req.headers.get('Authorization') || '',
            Cookie: req.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            meetingUrl: meeting.meetingUrl,
            meetingId: meeting.id,
            projectId: meeting.projectId,
          }),
        });

        if (processResponse.ok) {
          // Fetch updated meeting status
          const updatedMeeting = await db.meeting.findUnique({
            where: { id: meetingId },
            include: { issues: true },
          });

          return NextResponse.json({
            success: true,
            status: updatedMeeting?.status || 'PROCESSING',
            hasTranscript: !!updatedMeeting?.transcript,
            issuesCount: updatedMeeting?.issues.length || 0,
            message: 'Processing completed successfully',
          });
        } else {
          // Processing failed, but meeting exists
          const errorData = await processResponse.json().catch(() => ({}));
          return NextResponse.json({
            success: false,
            status: 'PROCESSING',
            hasTranscript: false,
            issuesCount: 0,
            message: `Processing failed: ${errorData.error || 'Unknown error'}`,
          });
        }
      } catch (processError) {
        console.error('Error re-processing meeting:', processError);
        return NextResponse.json({
          success: false,
          status: 'PROCESSING',
          hasTranscript: false,
          issuesCount: 0,
          message: 'Failed to re-process meeting. Please try again.',
        });
      }
    }

    // Handle other statuses
    return NextResponse.json({
      success: true,
      status: meeting.status,
      hasTranscript: !!meeting.transcript,
      issuesCount: meeting.issues.length,
      message: `Meeting status: ${meeting.status}`,
    });
  } catch (error) {
    console.error('Error syncing meeting status:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync meeting status',
        success: false,
        status: 'UNKNOWN',
        hasTranscript: false,
        issuesCount: 0,
        message: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
