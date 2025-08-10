import { NextRequest, NextResponse } from 'next/server';
import { checkAndSyncProStatus } from '@/lib/checkAndSyncProStatus';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true });
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }
    await checkAndSyncProStatus(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
