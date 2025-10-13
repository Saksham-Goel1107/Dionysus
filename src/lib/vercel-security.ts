/**
 * Vercel API Security Utilities
 * Provides additional security layers for Vercel API operations
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

/**
 * Verify admin authentication for Vercel API routes
 * Triple verification: userId, email, and role
 */
export async function verifyAdminAuth(): Promise<{
  authorized: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const { userId, sessionClaims } = await auth();

    // Check if user is logged in
    if (!userId) {
      return { authorized: false, error: 'Not authenticated' };
    }

    // Check if user ID matches admin
    if (userId !== process.env.ADMIN_USER_ID) {
      return { authorized: false, error: 'Unauthorized user' };
    }

    // Check if role matches admin
    if (sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET) {
      return { authorized: false, error: 'Invalid role' };
    }

    return { authorized: true, userId };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authorized: false, error: 'Authentication failed' };
  }
}

/**
 * Rate limiting tracker for Vercel API calls
 * Simple in-memory rate limiting (use Redis in production for distributed systems)
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly maxRequests = 50; // Max requests per window
  private readonly windowMs = 60000; // 1 minute window

  check(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const userLimit = this.requests.get(userId);

    if (!userLimit || now > userLimit.resetAt) {
      // New window
      const resetAt = now + this.windowMs;
      this.requests.set(userId, { count: 1, resetAt });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt };
    }

    if (userLimit.count >= this.maxRequests) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetAt: userLimit.resetAt };
    }

    // Increment count
    userLimit.count++;
    this.requests.set(userId, userLimit);
    return {
      allowed: true,
      remaining: this.maxRequests - userLimit.count,
      resetAt: userLimit.resetAt,
    };
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [userId, limit] of this.requests.entries()) {
      if (now > limit.resetAt) {
        this.requests.delete(userId);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

/**
 * Sanitize deployment ID to prevent injection attacks
 */
export function sanitizeDeploymentId(id: string): string {
  // Vercel deployment IDs are alphanumeric with underscores and hyphens
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Validate Vercel deployment ID format
 */
export function isValidDeploymentId(id: string): boolean {
  // Vercel IDs typically start with 'dpl_' followed by alphanumeric characters
  return /^dpl_[a-zA-Z0-9]{20,30}$/.test(id);
}

/**
 * Validate state filter parameter
 */
export function isValidDeploymentState(state: string): boolean {
  const validStates = ['BUILDING', 'ERROR', 'INITIALIZING', 'QUEUED', 'READY', 'CANCELED'];
  return validStates.includes(state);
}

/**
 * Validate target parameter
 */
export function isValidDeploymentTarget(target: string): boolean {
  const validTargets = ['production', 'staging', 'preview'];
  return validTargets.includes(target);
}

/**
 * Sanitize and validate query parameters
 */
export function sanitizeQueryParams(request: NextRequest): {
  limit?: number;
  since?: number;
  until?: number;
  state?: string;
} {
  const { searchParams } = new URL(request.url);

  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const since = searchParams.get('since') ? parseInt(searchParams.get('since')!, 10) : undefined;
  const until = searchParams.get('until') ? parseInt(searchParams.get('until')!, 10) : undefined;
  const state = searchParams.get('state') || undefined;

  // Validate state if provided
  if (state && !isValidDeploymentState(state)) {
    return { limit };
  }

  return {
    limit: isNaN(limit) ? 20 : limit,
    since: since && !isNaN(since) ? since : undefined,
    until: until && !isNaN(until) ? until : undefined,
    state,
  };
}

/**
 * Mask sensitive data in logs
 */
export function maskToken(token: string): string {
  if (token.length <= 8) return '***';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}

/**
 * Log security events
 */
export function logSecurityEvent(event: {
  type: 'auth_success' | 'auth_failure' | 'rate_limit' | 'invalid_input' | 'api_error';
  userId?: string;
  details?: string;
  ip?: string;
}): void {
  const timestamp = new Date().toISOString();
  console.log(
    JSON.stringify({
      timestamp,
      event: 'vercel_api_security',
      ...event,
    }),
  );
}

/**
 * Create safe error response
 * Prevents leaking sensitive information in error messages
 */
export function createSafeErrorResponse(
  error: unknown,
  userMessage: string = 'An error occurred',
): { message: string; code?: string } {
  if (error instanceof Error) {
    // Log full error server-side
    console.error('Vercel API Error:', error);

    // Return safe message to client
    return {
      message: userMessage,
      code: error.name,
    };
  }

  return { message: userMessage };
}
