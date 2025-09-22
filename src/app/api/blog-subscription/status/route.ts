import { isBlogSubscribed } from '@/lib/googleSheets';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await isBlogSubscribed(email);

    if (result.error) {
      return NextResponse.json({ error: 'Failed to check subscription status' }, { status: 500 });
    }

    return NextResponse.json({ subscribed: result.isSubscribed });
  } catch (error) {
    console.error('Blog subscription status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
