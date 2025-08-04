import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const { has } = await auth();
  const hasProPlan = has({ plan: 'dionysus_advance_pack' });
  if (!hasProPlan) {
    return NextResponse.json(
      { error: 'Advance plan required for LiveKit token generation' },
      { status: 403 },
    );
  }
  try {
    const body = await req.json();
    const userId = String(body.userId);
    const userName = String(body.userName || '');
    const projectId = String(body.projectId);

    if (!userId || !projectId || !userName) {
      return NextResponse.json(
        { error: 'Missing userId, userName, or projectId' },
        { status: 400 },
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit credentials not set' }, { status: 500 });
    }

    const roomName = `project-${projectId}`;
    const at = new AccessToken(apiKey, apiSecret, { identity: userName });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    const tokenStr = typeof token === 'string' ? token : String(token ?? '');
    if (!tokenStr || tokenStr.split('.').length !== 3) {
      return NextResponse.json(
        {
          error: 'Failed to generate valid JWT token',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ token: tokenStr, roomName });
  } catch (err: any) {
    console.error('LiveKit token generation failed:', err);
    return NextResponse.json(
      { error: 'LiveKit token generation failed', details: err?.message || String(err) },
      { status: 500 },
    );
  }
}
