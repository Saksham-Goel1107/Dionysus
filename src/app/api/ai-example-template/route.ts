// Example AI API route with stricter rate limiting
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic'; // No caching

export async function POST(req: NextRequest) {
  // Get authenticated user
  let isAuthenticated = false;
  try {
    const session = await auth();
    isAuthenticated = !!session.userId;
  } catch (e) {
    // User is not authenticated
    isAuthenticated = false;
  }

  // Apply stricter rate limiting for AI endpoints
  const rateLimitResult = await withRateLimit(req, 'api-ai', {
    // Authenticated users get higher limits
    limit: isAuthenticated ? 15 : 3,
    window: 60,
    errorMessage: 'AI API rate limit exceeded. Please try again later or upgrade your plan.',
  });

  // If rate limit exceeded, return the rate limit response
  if (rateLimitResult) return rateLimitResult;

  try {
    // Process the AI request here
    // const data = await req.json();
    // ... AI processing logic ...

    // Return successful response
    return NextResponse.json({ success: true, result: 'AI response data' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 },
    );
  }
}
