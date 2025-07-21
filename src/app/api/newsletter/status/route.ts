import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isSubscribed } from '@/lib/googleSheets';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userResponse = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    const userData = await userResponse.json();
    const email = userData.email_addresses?.[0]?.email_address;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'No email found for user' },
        { status: 400 }
      );
    }

    const { isSubscribed: subscriptionStatus, error } = await isSubscribed(email);

    if (error) {
      console.error('Error checking subscription status:', error);
      return NextResponse.json(
        { success: false, message: 'Error checking subscription status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, isSubscribed: subscriptionStatus });
  } catch (error) {
    console.error('Error in newsletter status API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
