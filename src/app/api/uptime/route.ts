import { NextResponse } from 'next/server';

const API_KEY = process.env.UPTIME_ROBOT_API_KEY;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Allow': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  try {
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
    const data = await response.json();
    
    if (data.stat === 'ok' && Array.isArray(data.monitors)) {
      const formattedMonitors = data.monitors.map((monitor: any) => ({
        ...monitor,
        all_time_uptime_ratio: monitor.all_time_uptime_ratio,
        last_check: monitor.last_check || Math.floor(Date.now() / 1000),
        average_response_time: monitor.average_response_time || 0,
        all_time_uptime_durations: monitor.all_time_uptime_durations || { uptime: 100, downtime: 0 },
        logs: Array.isArray(monitor.logs) ? monitor.logs : [],
        response_times: Array.isArray(monitor.response_times) ? monitor.response_times : []
      }));
      
      return NextResponse.json({
        stat: 'ok',
        monitors: formattedMonitors
      });
    }  
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Uptime Robot data:', error);
    return new NextResponse('OK', { status: 200 });
  }
}
