import { NextRequest, NextResponse } from 'next/server';
import { sendDataExportWarningEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { to, name } = await req.json();
    if (!to) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    await sendDataExportWarningEmail({ to, name });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
