import { NextRequest, NextResponse } from 'next/server';
import type { Result } from 'autocannon';
import { userHasProPlan } from '@/lib/check-pro-status';

export async function POST(req: NextRequest) {
  try {
    const hasProPlan = await userHasProPlan({ advancedOnly: true });
    if (!hasProPlan) {
      return NextResponse.json(
        {
          error: 'You need to upgrade to Advance to use this feature.',
        },
        { status: 403 },
      );
    }
    const { url, users, userInfo } = await req.json();
    if (!url || !users) {
      return NextResponse.json({ error: 'Missing url or users' }, { status: 400 });
    }
    if (users > 10000) {
      return NextResponse.json({ error: 'Number of users cannot exceed 10,000.' }, { status: 400 });
    }

    // Log user info for identification
    console.log('[Stress Test Request] User Info:', userInfo, 'Target URL:', url);

    let autocannon: typeof import('autocannon');
    try {
      autocannon = (await import('autocannon')).default;
    } catch {
      return NextResponse.json(
        { error: 'autocannon not installed or not supported in this environment.' },
        { status: 500 },
      );
    }

    const result = await new Promise<Result>((resolve, reject) => {
      autocannon(
        {
          url,
          connections: Math.min(users, 1000),
          amount: users,
          duration: 10,
        },
        (err: Error | null, res: Result) => {
          if (err) return reject(err);
          resolve(res);
        },
      );
    });
    return NextResponse.json({
      latency: result.latency,
      requests: result.requests,
      throughput: result.throughput,
      errors: result.errors,
      non2xx: (result as any)['non2xx'],
      statusCodeStats: (result as any)['statusCodeStats'],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
