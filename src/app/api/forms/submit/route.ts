import { validateApiKeyFormat, verifyApiKey } from '@/lib/api-keys';
import { saveFormSubmission } from '@/lib/firebase-forms';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting (simple in-memory store, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = ip;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

    // Rate limiting check
    if (!checkRateLimit(ip, 60)) {
      // 60 requests per minute per IP
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Get API key from header or query param
    const apiKey =
      headersList.get('x-api-key') ||
      headersList.get('authorization')?.replace('Bearer ', '') ||
      request.nextUrl.searchParams.get('api_key');

    if (!apiKey || !validateApiKeyFormat(apiKey)) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    // Extract key ID for database lookup
    const keyId = apiKey.replace('fk_', '').slice(0, 8);

    // Find and verify API key
    const apiKeyRecord = await prisma.formApiKey.findUnique({
      where: { keyId },
      include: {
        project: true,
      },
    });

    if (!apiKeyRecord || !apiKeyRecord.isActive || !apiKeyRecord.project.isActive) {
      return NextResponse.json({ error: 'Invalid API key or inactive project' }, { status: 401 });
    }

    // Verify the hashed API key
    const isValidKey = await verifyApiKey(apiKey, apiKeyRecord.keyHash);
    if (!isValidKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Check CORS if domain is specified
    const origin = headersList.get('origin');
    if (apiKeyRecord.project.domain && origin) {
      const allowedDomains: string[] = apiKeyRecord.project.domain
        .split(',')
        .map((d: string) => d.trim());
      interface AllowedDomainCheckOptions {
        allowedDomains: string[];
        origin: string;
      }

      const isAllowed = (({ allowedDomains, origin }: AllowedDomainCheckOptions): boolean => {
        return allowedDomains.some((domain: string) => {
          if (domain === 'localhost' || domain.startsWith('localhost:')) {
            return origin.includes('localhost');
          }
          return origin.includes(domain);
        });
      })({ allowedDomains, origin });

      if (!isAllowed) {
        return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
      }
    }

    // Parse form data
    let formData: Record<string, any> = {};
    const contentType = headersList.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      formData = Object.fromEntries(params.entries());
    } else {
      try {
        const form = await request.formData();
        formData = Object.fromEntries(form.entries());
      } catch {
        return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
      }
    }

    // Sanitize and validate form data
    const sanitizedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key.replace(/[<>]/g, ''), // Basic XSS prevention
        typeof value === 'string' ? value.slice(0, 1000) : value, // Limit string length
      ]),
    );

    // Save to Firebase
    const submissionId = await saveFormSubmission({
      projectId: apiKeyRecord.projectId,
      keyId: apiKeyRecord.keyId,
      data: sanitizedData,
      metadata: {
        userAgent: headersList.get('user-agent') || undefined,
        ip: ip !== 'unknown' ? ip : undefined,
        referer: headersList.get('referer') || undefined,
        timestamp: Date.now(),
      },
    });

    // Update API key usage stats
    await prisma.formApiKey.update({
      where: { id: apiKeyRecord.id },
      data: {
        lastUsedAt: new Date(),
        requestCount: { increment: 1 },
      },
    });

    // Return success response
    const response = NextResponse.json(
      {
        success: true,
        submissionId,
        message: 'Form submitted successfully',
      },
      { status: 200 },
    );

    // Add CORS headers
    if (origin && apiKeyRecord.project.domain) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, X-API-Key, Authorization',
      );
    }

    return response;
  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  const headersList = await headers();
  const origin = headersList.get('origin');

  const response = new NextResponse(null, { status: 200 });

  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}
