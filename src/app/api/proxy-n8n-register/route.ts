import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, has } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const n8nRegistrationEnabled = process.env.NEXT_PUBLIC_N8N_REGISTRATION !== 'false';

    if (!n8nRegistrationEnabled) {
      return NextResponse.json({ error: 'N8N registration is not enabled.' }, { status: 403 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const hasAdvancePlan = has({ plan: 'dionysus_advance_pack' });

    if (!hasAdvancePlan) {
      return NextResponse.json(
        { error: 'You need to upgrade to Advance Pack to use this feature.' },
        { status: 403 },
      );
    }

    // Check if user has already registered with n8n
    const dbUser = await db.user.findUnique({
      where: { emailAddress: user.emailAddresses[0]?.emailAddress },
      select: { isN8nDone: true },
    });

    if (dbUser?.isN8nDone) {
      return NextResponse.json(
        { error: 'You have already registered with n8n. Multiple registrations are not allowed.' },
        { status: 409 },
      );
    }

    const body = await req.json();

    const apiUrl = process.env.N8N_REGISTRATION_API_URL;
    const apiKey = process.env.N8N_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error('Missing N8N_REGISTRATION_API_URL or N8N_API_KEY environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const n8nResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('N8N registration failed:', n8nResponse.status, errorText);
      return NextResponse.json(
        { error: `N8N registration failed: ${n8nResponse.status}` },
        { status: n8nResponse.status },
      );
    }

    await db.user.update({
      where: { emailAddress: user.emailAddresses[0]?.emailAddress },
      data: { isN8nDone: true },
    });

    const result = await n8nResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Proxy N8N registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
