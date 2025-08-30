import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFeatureFlagValue } from '@/lib/configcat';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alphaHelpEnabled = await getFeatureFlagValue('alphahelpEnabled', false);

    if (!alphaHelpEnabled) {
      return NextResponse.json({ error: 'Alpha help is not enabled.' }, { status: 403 });
    }

    const abTestResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/ab-testing/status`,
      {
        headers: {
          Authorization: `Bearer ${await auth().then((a) => a.getToken())}`,
        },
      },
    );

    if (!abTestResponse.ok) {
      return NextResponse.json({ error: 'Failed to verify alpha access' }, { status: 403 });
    }

    const abTestData = await abTestResponse.json();
    if (!abTestData.abTestingOptIn) {
      return NextResponse.json({ error: 'Alpha tester access required' }, { status: 403 });
    }

    const body = await request.json();

    const response = await fetch(process.env.N8N_WEBHOOK_ALPHA_TESTER_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Auth: process.env.N8N_WEBHOOK_ALPHA_TESTER_AUTH!,
      },
      body: JSON.stringify({
        ...body,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send to n8n webhook');
    }

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = { output: responseText };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Alpha support API error:', error);
    return NextResponse.json({ error: 'Failed to process support request' }, { status: 500 });
  }
}
