import { addBlogSubscriber } from '@/lib/googleSheets';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const result = await addBlogSubscriber(email, name);

    if (result.success) {
      return NextResponse.json({ message: 'Successfully subscribed to blog updates' });
    } else {
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }
  } catch (error) {
    console.error('Blog subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
