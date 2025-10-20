import type {
  LangSmithCostAnalysis,
  LangSmithDashboardData,
  LangSmithErrorAnalysis,
  LangSmithMetrics,
  LangSmithPerformanceAnalysis,
  LangSmithRun,
  LangSmithTimeSeriesData,
} from '@/types/langsmith';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Client } from 'langsmith';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Admin API endpoint for fetching comprehensive LangSmith metrics
 * Requires admin authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Admin verification
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (
      email !== process.env.ADMIN_EMAIL ||
      userId !== process.env.ADMIN_USER_ID ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 },
      );
    }

    // Check for LangSmith API key
    const langsmithApiKey = process.env.LANGCHAIN_API_KEY;
    if (!langsmithApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'LangSmith API key not configured',
          message: 'Please set LANGCHAIN_API_KEY environment variable',
        },
        { status: 500 },
      );
    }

    // Initialize LangSmith client
    const client = new Client({
      apiKey: langsmithApiKey,
    });

    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '7d'; // 24h, 7d, 30d, 90d
    const projectName = searchParams.get('project') || undefined;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch projects first
    let allProjects = [];
    try {
      const projectsIterator = client.listProjects();
      for await (const project of projectsIterator) {
        allProjects.push({
          id: project.id,
          name: project.name,
          description: project.description || null,
          created_at: project.created_at?.toISOString() || new Date().toISOString(),
          updated_at: project.created_at?.toISOString() || new Date().toISOString(),
          run_count: 0,
          tenant_id: project.tenant_id || '',
          metadata: project.metadata || {},
          tags: project.tags || [],
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }

    // Filter projects if projectName is specified
    const targetProjects = projectName
      ? allProjects.filter((p) => p.name === projectName)
      : allProjects;

    // Fetch runs for each project
    const runs: LangSmithRun[] = [];
    let runCount = 0;

    try {
      for (const project of targetProjects) {
        try {
          // Try to get runs for this specific project
          const runsIterator = client.listRuns({
            projectName: project.name,
            startTime: startDate,
            endTime: endDate,
            limit: 100, // Limit per project to prevent memory issues
          });

          for await (const run of runsIterator) {
            // Helper function to safely convert date
            const safeDateToISOString = (date: any): string | null => {
              if (!date) return null;
              if (typeof date === 'string') return date;
              if (date instanceof Date) return date.toISOString();
              if (date.toISOString) return date.toISOString();
              return new Date(date).toISOString();
            };

            const langsmithRun: LangSmithRun = {
              id: run.id,
              name: run.name || 'Unnamed',
              run_type: run.run_type as any,
              start_time: safeDateToISOString(run.start_time) || new Date().toISOString(),
              end_time: safeDateToISOString(run.end_time),
              status: run.error ? 'error' : run.end_time ? 'success' : 'pending',
              error: run.error || null,
              inputs: run.inputs || {},
              outputs: run.outputs || null,
              metadata: run.extra?.metadata || {},
              tags: run.tags || [],
              parent_run_id: run.parent_run_id || null,
              trace_id: run.trace_id || run.id,
              session_id: run.session_id || null,
              session_name: (run.extra?.metadata as any)?.session_name || null,
              total_tokens: (run.extra?.metadata as any)?.total_tokens || null,
              prompt_tokens: (run.extra?.metadata as any)?.prompt_tokens || null,
              completion_tokens: (run.extra?.metadata as any)?.completion_tokens || null,
              total_cost: (run.extra?.metadata as any)?.total_cost || null,
              prompt_cost: (run.extra?.metadata as any)?.prompt_cost || null,
              completion_cost: (run.extra?.metadata as any)?.completion_cost || null,
              serialized: run.serialized || null,
              events: run.events || null,
              latency: (() => {
                if (!run.start_time || !run.end_time) return null;
                const start = new Date(run.start_time);
                const end = new Date(run.end_time);
                return end.getTime() - start.getTime();
              })(),
              feedback_stats: null,
            };

            runs.push(langsmithRun);
            runCount++;

            // Limit to 1000 runs to prevent memory issues
            if (runCount >= 1000) break;
          }

          if (runCount >= 1000) break;
        } catch (projectError) {
          console.error(`Error fetching runs for project ${project.name}:`, projectError);
          // Continue with other projects
        }
      }
    } catch (error) {
      console.error('Error fetching runs:', error);
    }

    // Calculate metrics
    const metrics = calculateMetrics(runs);
    const timeSeries = calculateTimeSeries(runs, timeRange);
    const errorAnalysis = analyzeErrors(runs);
    const performanceAnalysis = analyzePerformance(runs);
    const costAnalysis = analyzeCosts(runs);

    // Get recent runs (last 20)
    const recentRuns = runs
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .slice(0, 20);

    // Get top runs by latency and cost
    const topRuns = runs
      .filter((r) => r.latency !== null || r.total_cost !== null)
      .map((r) => ({
        run_id: r.id,
        name: r.name,
        latency: r.latency || 0,
        tokens: r.total_tokens || 0,
        cost: r.total_cost || 0,
        status: r.status,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    // Fetch projects
    let projects = allProjects;

    const dashboardData: LangSmithDashboardData = {
      metrics,
      timeSeries,
      recentRuns,
      projects,
      sessions: [], // Sessions would need separate implementation
      errorAnalysis,
      performanceAnalysis,
      costAnalysis,
      topRuns,
    };

    return NextResponse.json(
      {
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching LangSmith data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch LangSmith data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Helper function to calculate metrics
function calculateMetrics(runs: LangSmithRun[]): LangSmithMetrics {
  const total_runs = runs.length;
  const successful_runs = runs.filter((r) => r.status === 'success').length;
  const failed_runs = runs.filter((r) => r.status === 'error').length;
  const pending_runs = runs.filter((r) => r.status === 'pending').length;

  const success_rate = total_runs > 0 ? (successful_runs / total_runs) * 100 : 0;

  const latencies = runs.filter((r) => r.latency !== null).map((r) => r.latency!);
  const average_latency =
    latencies.length > 0 ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;

  const total_tokens = runs.reduce((sum, r) => sum + (r.total_tokens || 0), 0);
  const total_cost = runs.reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const runs_by_type = {
    llm: runs.filter((r) => r.run_type === 'llm').length,
    chain: runs.filter((r) => r.run_type === 'chain').length,
    tool: runs.filter((r) => r.run_type === 'tool').length,
    retriever: runs.filter((r) => r.run_type === 'retriever').length,
    prompt: runs.filter((r) => r.run_type === 'prompt').length,
  };

  const runs_by_status = {
    success: successful_runs,
    error: failed_runs,
    pending: pending_runs,
  };

  const cost_breakdown = {
    prompt_cost: runs.reduce((sum, r) => sum + (r.prompt_cost || 0), 0),
    completion_cost: runs.reduce((sum, r) => sum + (r.completion_cost || 0), 0),
    total_cost,
  };

  const token_usage = {
    prompt_tokens: runs.reduce((sum, r) => sum + (r.prompt_tokens || 0), 0),
    completion_tokens: runs.reduce((sum, r) => sum + (r.completion_tokens || 0), 0),
    total_tokens,
  };

  return {
    total_runs,
    successful_runs,
    failed_runs,
    pending_runs,
    success_rate,
    average_latency,
    total_tokens,
    total_cost,
    runs_by_type,
    runs_by_status,
    cost_breakdown,
    token_usage,
    average_feedback_score: null,
    feedback_count: 0,
  };
}

// Helper function to calculate time series data
function calculateTimeSeries(runs: LangSmithRun[], timeRange: string): LangSmithTimeSeriesData[] {
  const intervals =
    timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const intervalMs = timeRange === '24h' ? 3600000 : 86400000; // 1 hour or 1 day

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - intervals * intervalMs);

  const timeSeries: LangSmithTimeSeriesData[] = [];

  for (let i = 0; i < intervals; i++) {
    const intervalStart = new Date(startDate.getTime() + i * intervalMs);
    const intervalEnd = new Date(intervalStart.getTime() + intervalMs);

    const intervalRuns = runs.filter((r) => {
      const runTime = new Date(r.start_time);
      return runTime >= intervalStart && runTime < intervalEnd;
    });

    const successful = intervalRuns.filter((r) => r.status === 'success').length;
    const failed = intervalRuns.filter((r) => r.status === 'error').length;

    const latencies = intervalRuns.filter((r) => r.latency !== null).map((r) => r.latency!);
    const avgLatency =
      latencies.length > 0 ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;

    timeSeries.push({
      timestamp: intervalStart.toISOString(),
      runs: intervalRuns.length,
      successful_runs: successful,
      failed_runs: failed,
      average_latency: avgLatency,
      total_tokens: intervalRuns.reduce((sum, r) => sum + (r.total_tokens || 0), 0),
      total_cost: intervalRuns.reduce((sum, r) => sum + (r.total_cost || 0), 0),
    });
  }

  return timeSeries;
}

// Helper function to analyze errors
function analyzeErrors(runs: LangSmithRun[]): LangSmithErrorAnalysis[] {
  const errorRuns = runs.filter((r) => r.status === 'error' && r.error);
  const errorMap = new Map<string, LangSmithRun[]>();

  errorRuns.forEach((run) => {
    const errorType = run.error?.split(':')[0] || 'Unknown Error';
    if (!errorMap.has(errorType)) {
      errorMap.set(errorType, []);
    }
    errorMap.get(errorType)!.push(run);
  });

  const totalErrors = errorRuns.length;
  const analysis: LangSmithErrorAnalysis[] = [];

  errorMap.forEach((runs, errorType) => {
    analysis.push({
      error_type: errorType,
      count: runs.length,
      percentage: totalErrors > 0 ? (runs.length / totalErrors) * 100 : 0,
      recent_errors: runs.slice(0, 5).map((r) => ({
        run_id: r.id,
        error_message: r.error || '',
        timestamp: r.start_time,
        trace_id: r.trace_id,
      })),
    });
  });

  return analysis.sort((a, b) => b.count - a.count);
}

// Helper function to analyze performance
function analyzePerformance(runs: LangSmithRun[]): LangSmithPerformanceAnalysis {
  const latencies = runs.filter((r) => r.latency !== null).map((r) => r.latency!);

  if (latencies.length === 0) {
    return {
      p50_latency: 0,
      p95_latency: 0,
      p99_latency: 0,
      min_latency: 0,
      max_latency: 0,
      average_latency: 0,
      std_dev_latency: 0,
    };
  }

  const sorted = latencies.sort((a, b) => a - b);
  const average = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  const variance =
    latencies.reduce((sum, lat) => sum + Math.pow(lat - average, 2), 0) / latencies.length;

  return {
    p50_latency: sorted[Math.floor(sorted.length * 0.5)] || 0,
    p95_latency: sorted[Math.floor(sorted.length * 0.95)] || 0,
    p99_latency: sorted[Math.floor(sorted.length * 0.99)] || 0,
    min_latency: sorted[0] || 0,
    max_latency: sorted[sorted.length - 1] || 0,
    average_latency: average,
    std_dev_latency: Math.sqrt(variance),
  };
}

// Helper function to analyze costs
function analyzeCosts(runs: LangSmithRun[]): LangSmithCostAnalysis {
  const total_cost = runs.reduce((sum, r) => sum + (r.total_cost || 0), 0);
  const cost_per_run = runs.length > 0 ? total_cost / runs.length : 0;

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 86400000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 86400000);

  const daily_cost = runs
    .filter((r) => new Date(r.start_time) >= oneDayAgo)
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const weekly_cost = runs
    .filter((r) => new Date(r.start_time) >= oneWeekAgo)
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const monthly_cost = runs
    .filter((r) => new Date(r.start_time) >= oneMonthAgo)
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const top_expensive_runs = runs
    .filter((r) => r.total_cost !== null && r.total_cost > 0)
    .sort((a, b) => (b.total_cost || 0) - (a.total_cost || 0))
    .slice(0, 5)
    .map((r) => ({
      run_id: r.id,
      name: r.name,
      cost: r.total_cost || 0,
      timestamp: r.start_time,
    }));

  // Simple trend calculation
  const recentCost = runs
    .filter((r) => new Date(r.start_time) >= oneWeekAgo)
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const previousCost = runs
    .filter((r) => {
      const runDate = new Date(r.start_time);
      return runDate < oneWeekAgo && runDate >= new Date(oneWeekAgo.getTime() - 7 * 86400000);
    })
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  let cost_trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (recentCost > previousCost * 1.1) cost_trend = 'increasing';
  else if (recentCost < previousCost * 0.9) cost_trend = 'decreasing';

  return {
    total_cost,
    cost_per_run,
    cost_trend,
    top_expensive_runs,
    daily_cost,
    weekly_cost,
    monthly_cost,
  };
}
