import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  permalink: string;
  shortId: string;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
  level: string;
  metadata: {
    type: string;
    value: string;
    filename?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (
      email !== process.env.ADMIN_EMAIL ||
      userId !== process.env.ADMIN_USER_ID ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const statsPeriod = searchParams.get('statsPeriod') || '14d';
    const query = searchParams.get('query') || 'is:unresolved';

    const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
    const SENTRY_ORG_SLUG = process.env.SENTRY_ORG_SLUG || 'saksham-vj';
    const SENTRY_PROJECT_SLUG = process.env.SENTRY_PROJECT_SLUG || 'javascript-nextjs';

    if (!SENTRY_AUTH_TOKEN) {
      return NextResponse.json(
        { error: 'Sentry authentication token not configured' },
        { status: 500 },
      );
    }

    const headers = {
      Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Fetch issues
    const issuesResponse = await fetch(
      `https://sentry.io/api/0/projects/${SENTRY_ORG_SLUG}/${SENTRY_PROJECT_SLUG}/issues/?statsPeriod=${statsPeriod}&query=${encodeURIComponent(query)}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!issuesResponse.ok) {
      const errorText = await issuesResponse.text();
      console.error('Sentry API error:', errorText);
      return NextResponse.json(
        { error: `Failed to fetch Sentry data: ${issuesResponse.statusText}` },
        { status: issuesResponse.status },
      );
    }

    const issues: SentryIssue[] = await issuesResponse.json();

    return NextResponse.json({
      success: true,
      issues: issues.slice(0, 100),
      total: issues.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in Sentry API route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (
      email !== process.env.ADMIN_EMAIL ||
      userId !== process.env.ADMIN_USER_ID ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { issueId, action } = body;

    if (!issueId || !action) {
      return NextResponse.json({ error: 'Missing issueId or action' }, { status: 400 });
    }

    const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
    const SENTRY_ORG_SLUG = process.env.SENTRY_ORG_SLUG || 'saksham-vj';

    if (!SENTRY_AUTH_TOKEN) {
      return NextResponse.json(
        { error: 'Sentry authentication token not configured' },
        { status: 500 },
      );
    }

    const headers = {
      Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Update issue status
    const updateResponse = await fetch(
      `https://sentry.io/api/0/organizations/${SENTRY_ORG_SLUG}/issues/`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status: action, // 'resolved', 'ignored', 'unresolved'
          statusDetails: {},
        }),
      },
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Sentry update error:', errorText);
      return NextResponse.json(
        { error: `Failed to update issue: ${updateResponse.statusText}` },
        { status: updateResponse.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Issue ${action} successfully`,
    });
  } catch (error: any) {
    console.error('Error updating Sentry issue:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
