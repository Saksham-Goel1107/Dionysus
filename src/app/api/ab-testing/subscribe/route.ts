import { getAbTestingLimit, getAbTestingSubscriberCount } from '@/lib/abTesting';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const subscribeSchema = z.object({
  abTestingOptIn: z.boolean(),
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

    const { abTestingOptIn } = validation.data;

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata || {};
    const currentlyOptedIn = currentMetadata.abTestingOptIn === true;

    if (abTestingOptIn && !currentlyOptedIn) {
      const currentCount = await getAbTestingSubscriberCount();
      const limit = getAbTestingLimit();

      if (currentCount >= limit) {
        return NextResponse.json(
          {
            success: false,
            message: `A/B testing program is currently full. Only ${limit} spots are available.`,
            currentCount,
            limit,
          },
          { status: 409 },
        );
      }
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        abTestingOptIn,
      },
    });

    return NextResponse.json({
      success: true,
      message: abTestingOptIn
        ? 'Successfully opted in to A/B testing'
        : 'Successfully opted out of A/B testing',
    });
  } catch (error) {
    console.error('Error in A/B testing subscription API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
