import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { removeSubscriber, isSubscribed } from '@/lib/googleSheets';
import { z } from 'zod';

const unsubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = unsubscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data', errors: validation.error.format() },
        { status: 400 },
      );
    }

    const { email } = validation.data;

    const { isSubscribed: currentlySubscribed } = await isSubscribed(email);

    if (!currentlySubscribed) {
      return NextResponse.json({ success: true, message: 'Not currently subscribed' });
    }

    const { success, error, message } = await removeSubscriber(email);

    if (!success) {
      console.error('Error removing subscriber:', error || message);
      return NextResponse.json(
        { success: false, message: 'Failed to unsubscribe. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Error in newsletter unsubscribe API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
