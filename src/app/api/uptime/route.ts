import { NextResponse } from 'next/server';

// Get API key from environment variables
const API_KEY = process.env.UPTIME_ROBOT_API_KEY;

export async function GET() {
  try {
    // Check if API key is configured
    if (!API_KEY) {
      return NextResponse.json(
        {
          stat: 'fail',
          error: {
            type: 'config_error',
            message: 'Uptime Robot API key not configured',
          },
        },
        { status: 500 },
      );
    }

    // Make the real API call to Uptime Robot
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        api_key: API_KEY,
        format: 'json',
        logs: 1, // Include logs
        response_times: 1, // Include response times
        response_times_limit: 24, // Last 24 hours
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          stat: 'fail',
          error: {
            type: 'api_error',
            message: errorData.error || 'Failed to fetch data from Uptime Robot',
          },
        },
        { status: response.status },
      );
    }

    // Return the actual data from Uptime Robot API
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Uptime Robot data:', error);
    return NextResponse.json(
      {
        stat: 'fail',
        error: {
          type: 'server_error',
          message: 'Internal server error',
        },
      },
      { status: 500 },
    );
  }
}
