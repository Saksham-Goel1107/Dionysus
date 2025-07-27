import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';
import { auth } from '@clerk/nextjs/server';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rateLimitResult = await withRateLimit(req, 'api-gemini', {
    limit: 10,
    window: 60,
    errorMessage: 'AI generation rate limit exceeded. Please try again later.',
  });

  if (rateLimitResult) return rateLimitResult;

  const { has } = await auth();
  const hasProPlan = has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });
  if (!hasProPlan) {
    return NextResponse.json({ error: 'Pro plan required' }, { status: 403 });
  }
  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }
  const result = await askGemini(prompt);
  return NextResponse.json(result);
}
