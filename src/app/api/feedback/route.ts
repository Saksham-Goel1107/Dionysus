import { env } from '@/env';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const feedbackSchema = z.object({
  rating: z.string().min(1, 'Rating is required'),
  feedback: z.string().optional(),
  email: z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      },
      { message: 'Email must be valid or left empty' },
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      var validatedData = feedbackSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');

        return NextResponse.json({ error: `Validation failed: ${errorMessages}` }, { status: 400 });
      }
      throw validationError; // Re-throw if not a Zod error
    }

    const formData = new URLSearchParams();
    formData.append('rating', validatedData.rating);
    if (validatedData.feedback) formData.append('feedback', validatedData.feedback);
    if (validatedData.email) formData.append('email', validatedData.email);

    const baseUrl = env.NEXT_PUBLIC_BASE_URL ?? '';

    const response = await fetch(`https://send.pageclip.co/${process.env.PAGECLIP_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: baseUrl,
        Referer: `${baseUrl}/dashboard`,
        'User-Agent': 'Mozilla/5.0 NextJS Server',
      },
      body: formData.toString(),
    });
    const responseStatus = response.status;
    let responseText;
    try {
      responseText = await response.json().catch(async () => {
        return await response.text().catch(() => 'No response text');
      });
    } catch {
      responseText = 'Could not parse response';
    }

    if (!response.ok) {
      const errorMsg =
        typeof responseText === 'string' ? responseText : JSON.stringify(responseText);
      throw new Error(`PageClip API error: ${responseStatus} - ${errorMsg}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Feedback submitted successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Feedback submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
