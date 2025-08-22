import { addStatusAlertSubscriber } from '@/lib/googleSheets';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const result = await addStatusAlertSubscriber(email, name);

    if (result.success) {
      return NextResponse.json({ message: 'Successfully subscribed to status alerts' });
    } else {
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }
  } catch (error) {
    console.error('Status alert subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
