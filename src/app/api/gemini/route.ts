import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }
  const result = await askGemini(prompt);
  return NextResponse.json(result);
}
