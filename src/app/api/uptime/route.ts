import { NextResponse } from 'next/server';
// import { Pool } from 'pg';

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

    // const pool = new Pool({
    //   connectionString: process.env.DATABASE_URL,
    //   ssl: { rejectUnauthorized: false },
    // });                                                          // Just to Save the Compute Time Limit Of Neon. But this is a recommended Check Just Turn This off if you have limited compute limit. @Saksham-Goel1107
    // try {
    //   await pool.query('SELECT 1');
    // } finally {
    //   await pool.end();
    // }

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
        all_time_uptime_ratio: 1,
        custom_uptime_ratios: '1-7-30-365',
        timezone: 1,
      }),
    });
    let data: any = {};
    try {
      data = await response.json();

      if (!data || typeof data !== 'object' || !Array.isArray(data.monitors)) {
        console.warn('UptimeRobot API returned invalid data structure:', data);
        data = { stat: 'fail', error: { message: 'Invalid data received from UptimeRobot' } };
      }
    } catch (e) {
      console.error('Error parsing UptimeRobot API response:', e);
      data = { stat: 'fail', error: { message: 'Failed to parse UptimeRobot response' } };
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

        let overallUptime = 0;
        let uptimePeriods = {
          '1day': 0,
          '7days': 0,
          '30days': 0,
          '365days': 0,
        };

        if (monitorsWithRecent.length > 0) {
          const totalUptime = monitorsWithRecent.reduce((sum: number, monitor: any) => {
            const ratio = parseFloat(monitor.all_time_uptime_ratio || '0');
            return sum + (isNaN(ratio) ? 0 : ratio);
          }, 0);

          overallUptime = totalUptime / monitorsWithRecent.length;

          monitorsWithRecent.forEach((monitor: any) => {
            if (monitor.custom_uptime_ratio) {
              const ratios = monitor.custom_uptime_ratio.split('-');
              if (ratios.length >= 4) {
                const day = parseFloat(ratios[0] || '0');
                const week = parseFloat(ratios[1] || '0');
                const month = parseFloat(ratios[2] || '0');
                const year = parseFloat(ratios[3] || '0');

                uptimePeriods['1day'] += isNaN(day) ? 0 : day;
                uptimePeriods['7days'] += isNaN(week) ? 0 : week;
                uptimePeriods['30days'] += isNaN(month) ? 0 : month;
                uptimePeriods['365days'] += isNaN(year) ? 0 : year;
              }
            }
          });

          Object.keys(uptimePeriods).forEach((period) => {
            uptimePeriods[period as keyof typeof uptimePeriods] /= monitorsWithRecent.length;
          });
        }

        const safeFormat = (num: any): number => {
          let parsed;
          try {
            parsed = typeof num === 'number' ? num : parseFloat(String(num || 0));
          } catch (e) {
            parsed = 0;
          }

          if (isNaN(parsed) || !isFinite(parsed)) {
            return 0;
          }

          try {
            return Math.round(parsed * 100) / 100;
          } catch (e) {
            return 0;
          }
        };

        let vercelStatus = {
          operational: true,
          status: 'operational',
          description: 'All systems operational',
        };

        try {
          const vercelRes = await fetch('https://www.vercel-status.com/api/v2/status.json', {
            headers: { 'Cache-Control': 'no-cache' },
          });

          if (vercelRes.ok) {
            const vercelData = await vercelRes.json();
            vercelStatus = {
              operational: vercelData?.status?.indicator === 'none',
              status: vercelData?.status?.indicator || 'unknown',
              description: vercelData?.status?.description || 'Status unknown',
            };
          }
        } catch (vercelError) {
          console.error('Error fetching Vercel status for response:', vercelError);
          vercelStatus = {
            operational: false,
            status: 'unknown',
            description: 'Unable to determine Vercel status',
          };
        }

        return jsonResp(
          {
            stat: 'ok',
            monitors: monitorsWithRecent,
            overall_uptime: safeFormat(overallUptime),
            uptime_periods: {
              day: safeFormat(uptimePeriods['1day']),
              week: safeFormat(uptimePeriods['7days']),
              month: safeFormat(uptimePeriods['30days']),
              year: safeFormat(uptimePeriods['365days']),
            },
            infrastructure: {
              vercel: vercelStatus,
            },
            monitor_count: monitorsWithRecent.length,
            last_updated: new Date().toISOString(),
          },
          200,
        );
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
