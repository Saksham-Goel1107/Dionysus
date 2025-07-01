// Example API route with rate limiting
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic'; // No caching

export async function GET(req: NextRequest) {
  // Apply rate limiting - 5 requests per minute for this endpoint
  const rateLimitResult = await withRateLimit(req, 'api-example', { 
    limit: 5, 
    window: 60, 
    errorMessage: 'Rate limit exceeded. Please try again later.'
  });
  
  // If rate limit exceeded, return the rate limit response
  if (rateLimitResult) return rateLimitResult;
  
  // Otherwise, process the request normally
  return NextResponse.json({ 
    success: true, 
    message: 'API request successful' 
  });
}
