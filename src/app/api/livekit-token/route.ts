// app/api/livekit-token/route.ts
import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = String(body.userId);
    const projectId = String(body.projectId);

    if (!userId || !projectId) {
      return NextResponse.json({ error: 'Missing userId or projectId' }, { status: 400 });
    }

    // LiveKit expects API_KEY first, then API_SECRET
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit credentials not set' }, { status: 500 });
    }

    const roomName = `project-${projectId}`;
    const at = new AccessToken(apiKey, apiSecret, { identity: userId });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    // Defensive: ensure token is a string before split
    const tokenStr = typeof token === 'string' ? token : String(token ?? '');
    if (!tokenStr || tokenStr.split('.').length !== 3) {
      return NextResponse.json({ error: 'Failed to generate valid JWT token', debug: { token: tokenStr, typeofToken: typeof token } }, { status: 500 });
    }

    return NextResponse.json({ token: tokenStr, roomName });
  } catch (err: any) {
    console.error('LiveKit token generation failed:', err);
    return NextResponse.json({ error: 'LiveKit token generation failed', details: err?.message || String(err) }, { status: 500 });
  }
}
