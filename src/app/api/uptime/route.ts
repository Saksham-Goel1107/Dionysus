import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const API_KEY = process.env.UPTIME_ROBOT_API_KEY;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

export async function HEAD(request: Request) {
  const reqHeaders = new Headers();
  if (request && request.headers) {
    for (const [k, v] of request.headers.entries()) reqHeaders.set(k, v);
  }
  if (reqHeaders.has('x-uptimerobot-monitor-id')) {
    return new NextResponse('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new NextResponse('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } });
}

export async function GET(request: Request) {
  const reqHeaders = new Headers();
  if (request && request.headers) {
    for (const [k, v] of request.headers.entries()) reqHeaders.set(k, v);
  }

  const plainText = (text: string, status = 200) =>
    new NextResponse(text, { status, headers: { 'Content-Type': 'text/plain' } });
  const jsonResp = (obj: any, status = 200) => NextResponse.json(obj, { status });

  if (!API_KEY || !process.env.DATABASE_URL) {
    const msg = 'Missing required environment variables';
    if (reqHeaders.has('x-uptimerobot-monitor-id')) return plainText('internal error', 500);
    return jsonResp({ stat: 'error', error: { message: msg } }, 500);
  }

  try {
    const clerkRes = await fetch('https://api.clerk.dev/v1/health');
    if (!clerkRes.ok) throw new Error('Clerk Unavailable');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await pool.query('SELECT 1');
    } finally {
      await pool.end();
    }

    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        api_key: API_KEY,
        format: 'json',
        logs: 1,
        response_times: 1,
        response_times_limit: 24,
      }),
    });
    let data: any = {};
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }

    if (data.stat === 'ok' && Array.isArray(data.monitors)) {
      if (reqHeaders.has('x-uptimerobot-monitor-id')) {
        return plainText('ok', 200);
      } else {
        const monitorsWithRecent = data.monitors.map((monitor: any) => {
          let recent_response_time = null;
          if (Array.isArray(monitor.response_times) && monitor.response_times.length > 0) {
            const latest = monitor.response_times.reduce((a: any, b: any) =>
              a.datetime > b.datetime ? a : b,
            );
            recent_response_time = latest.value;
          }
          return { ...monitor, recent_response_time };
        });
        return jsonResp({ stat: 'ok', monitors: monitorsWithRecent }, 200);
      }
    }
    if (reqHeaders.has('x-uptimerobot-monitor-id')) {
      return plainText('uptimerobot error', 503);
    } else {
      return jsonResp(
        { stat: 'error', error: { message: data.error?.message || 'UptimeRobot API error' } },
        500,
      );
    }
  } catch (error: any) {
    console.error('Error in /api/uptime:', error);
    if (reqHeaders.has('x-uptimerobot-monitor-id')) {
      return plainText('internal error', 500);
    } else {
      return jsonResp(
        { stat: 'error', error: { message: error?.message || 'Internal server error' } },
        500,
      );
    }
  }
}
