import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';
import { auth } from '@clerk/nextjs/server';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Apply rate limiting - stricter for AI endpoints
  const rateLimitResult = await withRateLimit(req, 'api-gemini', {
    limit: 10,  // 10 requests per minute
    window: 60, // 60 seconds window
    errorMessage: 'AI generation rate limit exceeded. Please try again later.'
  });

  // If rate limit exceeded, return the rate limit response
  if (rateLimitResult) return rateLimitResult;

  const { has } = await auth()
  const hasProPlan =has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });
  if(!hasProPlan){
    return NextResponse.json({ error: 'Pro plan required' }, { status: 403 });
  }
  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }
  const result = await askGemini(prompt);
  return NextResponse.json(result);
}
