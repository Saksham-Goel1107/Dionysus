/**
 * LangSmith API Types
 * Comprehensive type definitions for LangSmith monitoring
 */

export interface LangSmithRun {
  id: string;
  name: string;
  run_type: 'llm' | 'chain' | 'tool' | 'retriever' | 'prompt';
  start_time: string;
  end_time: string | null;
  status: 'success' | 'error' | 'pending';
  error: string | null;
  inputs: Record<string, any>;
  outputs: Record<string, any> | null;
  metadata: Record<string, any>;
  tags: string[];
  parent_run_id: string | null;
  trace_id: string;
  session_id: string | null;
  session_name: string | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_cost: number | null;
  prompt_cost: number | null;
  completion_cost: number | null;
  serialized: Record<string, any> | null;
  events: any[] | null;
  latency: number | null;
  feedback_stats: {
    score: number | null;
    value: number | null;
    comment: string | null;
  } | null;
}

export interface LangSmithProject {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  run_count: number;
  tenant_id: string;
  metadata: Record<string, any>;
  tags: string[];
}

export interface LangSmithFeedback {
  id: string;
  run_id: string;
  key: string;
  score: number | null;
  value: number | null;
  comment: string | null;
  correction: Record<string, any> | null;
  created_at: string;
  modified_at: string;
  feedback_source: {
    type: string;
    metadata: Record<string, any>;
  };
}

export interface LangSmithMetrics {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  pending_runs: number;
  success_rate: number;
  average_latency: number;
  total_tokens: number;
  total_cost: number;
  runs_by_type: {
    llm: number;
    chain: number;
    tool: number;
    retriever: number;
    prompt: number;
  };
  runs_by_status: {
    success: number;
    error: number;
    pending: number;
  };
  cost_breakdown: {
    prompt_cost: number;
    completion_cost: number;
    total_cost: number;
  };
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  average_feedback_score: number | null;
  feedback_count: number;
}

export interface LangSmithTimeSeriesData {
  timestamp: string;
  runs: number;
  successful_runs: number;
  failed_runs: number;
  average_latency: number;
  total_tokens: number;
  total_cost: number;
}

export interface LangSmithSession {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  run_count: number;
  metadata: Record<string, any>;
  tags: string[];
}

export interface LangSmithDataset {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  example_count: number;
  metadata: Record<string, any>;
  tags: string[];
}

export interface LangSmithErrorAnalysis {
  error_type: string;
  count: number;
  percentage: number;
  recent_errors: Array<{
    run_id: string;
    error_message: string;
    timestamp: string;
    trace_id: string;
  }>;
}

export interface LangSmithPerformanceAnalysis {
  p50_latency: number;
  p95_latency: number;
  p99_latency: number;
  min_latency: number;
  max_latency: number;
  average_latency: number;
  std_dev_latency: number;
}

export interface LangSmithCostAnalysis {
  total_cost: number;
  cost_per_run: number;
  cost_trend: 'increasing' | 'decreasing' | 'stable';
  top_expensive_runs: Array<{
    run_id: string;
    name: string;
    cost: number;
    timestamp: string;
  }>;
  daily_cost: number;
  weekly_cost: number;
  monthly_cost: number;
}

export interface LangSmithDashboardData {
  metrics: LangSmithMetrics;
  timeSeries: LangSmithTimeSeriesData[];
  recentRuns: LangSmithRun[];
  projects: LangSmithProject[];
  sessions: LangSmithSession[];
  errorAnalysis: LangSmithErrorAnalysis[];
  performanceAnalysis: LangSmithPerformanceAnalysis;
  costAnalysis: LangSmithCostAnalysis;
  topRuns: Array<{
    run_id: string;
    name: string;
    latency: number;
    tokens: number;
    cost: number;
    status: string;
  }>;
}

export interface LangSmithAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
