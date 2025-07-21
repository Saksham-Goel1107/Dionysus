import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  sendPasswordSetWarningEmail,
  sendPasswordChangeWarningEmail,
  sendPasswordDeleteWarningEmail,
  sendNewAccountWelcomeEmail,
} from '@/lib/email';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user || !user.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { success: false, error: 'User not found or not authenticated.' },
        { status: 401 },
      );
    }
    const email = user.emailAddresses[0].emailAddress;
    const name = user.firstName || '';
    const { type } = await req.json();
    if (type === 'change') {
      await sendPasswordChangeWarningEmail({ to: email, name });
    } else if (type === 'delete') {
      await sendPasswordDeleteWarningEmail({ to: email, name });
    } else if (type === 'new account') {
      await sendNewAccountWelcomeEmail({ to: email, name });
    } else {
      await sendPasswordSetWarningEmail({ to: email, name });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending password warning email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send warning email.' },
      { status: 500 },
    );
  }
}
