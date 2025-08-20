import { db } from '@/server/db';
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // If n8n registration successful, update user's isN8nDone status
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
