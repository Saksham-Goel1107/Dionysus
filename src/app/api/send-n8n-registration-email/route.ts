import { sendN8nRegistrationEmail } from '@/lib/email';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user || !user.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { username } = body || {};
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Missing username fields' },
        { status: 400 },
      );
    }

    const email = user.emailAddresses[0].emailAddress;
    const name = user.firstName || '';

    await sendN8nRegistrationEmail({
      to: email,
      name,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error sending n8n registration email:', err);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
