import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateImage } from '../image-genration/route';
import { rateLimit } from '@/lib/rate-limit';
import { handleUserCreditsChange } from '@/lib/handleUserCreditsChange';
import { readReplicaDb } from '@/server/read-replica-db';

export async function POST(req: NextRequest) {
  try {
    const { userId, has } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const hasProPlan = has({ plan: 'dionysus_advance_pack' });
    if (!hasProPlan) {
      return NextResponse.json({ error: 'Advance plan required' }, { status: 403 });
    }

    // Rate limiting
    const identifier = userId;
    const { success, limit, remaining } = await rateLimit(req, identifier, {
      limit: 5,
      window: 60,
    });

    if (!success) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Try again in a few minutes. Remaining: ${remaining}/${limit}`,
        },
        { status: 429 },
      );
    }

    // Parse request body
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const prisma = (global as any).prisma || (await import('@/lib/prisma')).default;
    const user = await readReplicaDb.user.findUnique({
      where: { id: userId },
      select: { emailAddress: true, firstName: true, credits: true },
    });

    if ((user?.credits ?? 0) < 5) {
      return NextResponse.json(
        { error: 'You do not have enough credits to generate a logo. Please top up your credits.' },
        { status: 402 },
      );
    }

    // Enhanced prompt for web/app header logo
    const enhancedPrompt = `Design a single, clean, modern, and professional logo for a website or app header for the brand: "${prompt}". The logo must have a transparent background (PNG), be centered, and only include the brand name and a simple, relevant icon if appropriate. Do NOT add any extra text, borders, decorative lines, or background shapes. The logo should be clear, sharp, scalable, and suitable for use in a website or app header. No watermark, no extra elements that are not said in the prompt `;

    const imageUrl = await generateImage(enhancedPrompt);

    // Deduct credits from user
    await prisma.user.update({
      where: { id: userId },
      data: { credits: (user?.credits ?? 0) - 5 },
    });

    await handleUserCreditsChange({
      userId,
      userEmail: user?.emailAddress ?? '',
      userName: user?.firstName ?? '',
      credits: (user?.credits ?? 0) - 5,
      prisma,
    });
    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Logo generation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate logo' },
      { status: 500 },
    );
  }
}
