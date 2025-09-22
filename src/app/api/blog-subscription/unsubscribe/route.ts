import { removeBlogSubscriber } from '@/lib/googleSheets';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await removeBlogSubscriber(email);

    if (result.success) {
      return NextResponse.json({ message: 'Successfully unsubscribed from blog updates' });
    } else {
      return NextResponse.json(
        { error: result.message || 'Failed to unsubscribe' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Blog unsubscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
