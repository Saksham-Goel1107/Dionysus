import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { addSubscriber, isSubscribed } from '@/lib/googleSheets';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data', errors: validation.error.format() },
        { status: 400 },
      );
    }

    const { email, name } = validation.data;

    const { isSubscribed: alreadySubscribed } = await isSubscribed(email);

    if (alreadySubscribed) {
      return NextResponse.json({ success: true, message: 'Already subscribed' });
    }

    const { success, error } = await addSubscriber(email, name || '');

    if (!success) {
      console.error('Error adding subscriber:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to subscribe. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: 'Successfully subscribed' });
  } catch (error) {
    console.error('Error in newsletter subscribe API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
