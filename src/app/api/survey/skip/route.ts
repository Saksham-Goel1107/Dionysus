import { db } from '@/server/db';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId: bodyUserId } = body;

    if (bodyUserId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { SurveyDone: true },
        });
      });

      return NextResponse.json({
        message: 'Survey successfully skipped',
        success: true,
      });
    } catch (dbError) {
      console.error('Database error during survey skip:', dbError);
      return NextResponse.json({ message: 'Failed to skip survey' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in survey skip API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
