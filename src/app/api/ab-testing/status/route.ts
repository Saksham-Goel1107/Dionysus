import { getAbTestingLimit, getAbTestingSubscriberCount } from '@/lib/abTesting';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.publicMetadata || {};

    const abTestingOptIn = metadata.abTestingOptIn === true;

    const currentCount = await getAbTestingSubscriberCount();
    const limit = await getAbTestingLimit();

    return NextResponse.json({
      success: true,
      abTestingOptIn,
      currentCount,
      limit,
      spotsRemaining: Math.max(0, limit - currentCount),
    });
  } catch (error) {
    console.error('Error in A/B testing status API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
