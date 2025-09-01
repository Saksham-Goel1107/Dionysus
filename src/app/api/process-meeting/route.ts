import { processMeeting } from '@/lib/assembly';
import { db } from '@/server/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bodyParser = z.object({
  meetingUrl: z.string(),
  projectId: z.string(),
  meetingId: z.string(),
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  const { has } = await auth();
  const hasProPlan = has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });
  if (!hasProPlan) {
    return NextResponse.json(
      {
        error: 'You need to upgrade to Pro to use this feature.',
      },
      { status: 403 },
    );
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unatuthorized' }, { status: 401 });
  }

  let meetingId: string | undefined;

  try {
    const body = await req.json();
    const parsed = bodyParser.parse(body);
    const { meetingUrl } = parsed;
    meetingId = parsed.meetingId; // Store for potential error handling

    const { summaries, transcript } = await processMeeting(meetingUrl);

    await db.issue.createMany({
      data: summaries.map((summary) => ({
        start: summary.start,
        end: summary.end,
        gist: summary.gist,
        headline: summary.headline,
        summary: summary.summary,
        meetingId: meetingId as string,
      })),
    });

    await db.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'COMPLETED',
        name: summaries[0]!.headline,
        transcript: transcript, // Store the transcript in the database
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Meeting processing failed:', error);

    // Update meeting status to FAILED in the database if we have meetingId
    if (meetingId) {
      try {
        await db.meeting.update({
          where: { id: meetingId },
          data: {
            status: 'FAILED',
          },
        });
      } catch (updateError) {
        console.error('Failed to update meeting status to FAILED:', updateError);
      }
    }

    return NextResponse.json({ error: 'Meeting processing failed' }, { status: 500 });
  }
}
