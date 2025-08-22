import { removeStatusAlertSubscriber } from '@/lib/googleSheets';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await removeStatusAlertSubscriber(email);

    if (result.success) {
      return NextResponse.json({ message: 'Successfully unsubscribed from status alerts' });
    } else {
      return NextResponse.json(
        { error: result.message || 'Failed to unsubscribe' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Status alert unsubscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
