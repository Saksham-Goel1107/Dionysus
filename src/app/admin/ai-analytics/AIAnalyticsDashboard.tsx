'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LangSmithDashboardData } from '@/types/langsmith';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AIAnalyticsDashboardProps {
  initialTimeRange?: string;
}

export default function AIAnalyticsDashboard({
  initialTimeRange = '7d',
}: AIAnalyticsDashboardProps) {
  const [data, setData] = useState<LangSmithDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/langsmith?timeRange=${timeRange}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch LangSmith data');
      }

      setData(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching LangSmith data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchData();
      }, 60000); // Refresh every minute

      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const handleExportData = () => {
    if (!data) return;

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `langsmith-analytics-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button onClick={fetchData} variant="outline" size="sm" className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Analytics Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor and analyze LangSmith AI metrics in real-time
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="icon"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExportData} title="Export data">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.total_runs.toLocaleString()}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.metrics.successful_runs} successful, {data.metrics.failed_runs} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.success_rate.toFixed(2)}%</div>
            <div className="mt-1">
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-green-600"
                  style={{ width: `${data.metrics.success_rate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.metrics.average_latency / 1000).toFixed(2)}s
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              P95: {(data.performanceAnalysis.p95_latency / 1000).toFixed(2)}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.metrics.total_cost.toFixed(4)}</div>
            <p className="mt-1 flex items-center text-xs text-muted-foreground">
              {data.costAnalysis.cost_trend === 'increasing' && (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-red-600" />
                  <span className="text-red-600">Increasing</span>
                </>
              )}
              {data.costAnalysis.cost_trend === 'decreasing' && (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-green-600">Decreasing</span>
                </>
              )}
              {data.costAnalysis.cost_trend === 'stable' && (
                <span className="text-muted-foreground">Stable</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.metrics.total_tokens / 1000).toFixed(1)}K
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Prompt: {(data.metrics.token_usage.prompt_tokens / 1000).toFixed(1)}K, Completion:{' '}
              {(data.metrics.token_usage.completion_tokens / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.metrics.failed_runs / data.metrics.total_runs) * 100).toFixed(2)}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{data.metrics.failed_runs} errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.costAnalysis.daily_cost.toFixed(4)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Weekly: ${data.costAnalysis.weekly_cost.toFixed(4)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.projects.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="runs">Recent Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Time Series Chart */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Activity Over Time</CardTitle>
                <CardDescription>Runs and success rate trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="runs"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      name="Total Runs"
                    />
                    <Area
                      type="monotone"
                      dataKey="successful_runs"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      name="Successful"
                    />
                    <Area
                      type="monotone"
                      dataKey="failed_runs"
                      stackId="2"
                      stroke="#ef4444"
                      fill="#ef4444"
                      name="Failed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Run Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Run Types Distribution</CardTitle>
                <CardDescription>Breakdown by run type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'LLM', value: data.metrics.runs_by_type.llm },
                        { name: 'Chain', value: data.metrics.runs_by_type.chain },
                        { name: 'Tool', value: data.metrics.runs_by_type.tool },
                        { name: 'Retriever', value: data.metrics.runs_by_type.retriever },
                        { name: 'Prompt', value: data.metrics.runs_by_type.prompt },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[...Array(5)].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Success vs errors</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      {
                        name: 'Status',
                        Success: data.metrics.runs_by_status.success,
                        Error: data.metrics.runs_by_status.error,
                        Pending: data.metrics.runs_by_status.pending,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Success" fill="#10b981" />
                    <Bar dataKey="Error" fill="#ef4444" />
                    <Bar dataKey="Pending" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Latency Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Latency Statistics</CardTitle>
                <CardDescription>Performance percentiles (ms)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Minimum</span>
                    <Badge variant="outline">
                      {data.performanceAnalysis.min_latency.toFixed(0)}ms
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">P50 (Median)</span>
                    <Badge variant="outline">
                      {data.performanceAnalysis.p50_latency.toFixed(0)}ms
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">P95</span>
                    <Badge variant="outline">
                      {data.performanceAnalysis.p95_latency.toFixed(0)}ms
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">P99</span>
                    <Badge variant="outline">
                      {data.performanceAnalysis.p99_latency.toFixed(0)}ms
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Maximum</span>
                    <Badge variant="outline">
                      {data.performanceAnalysis.max_latency.toFixed(0)}ms
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average</span>
                    <Badge>{data.performanceAnalysis.average_latency.toFixed(0)}ms</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Std Deviation</span>
                    <Badge variant="secondary">
                      {data.performanceAnalysis.std_dev_latency.toFixed(0)}ms
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Latency Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Latency Trend</CardTitle>
                <CardDescription>Average latency over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: any) => [`${value.toFixed(0)}ms`, 'Latency']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="average_latency"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Avg Latency (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Runs by Latency */}
          <Card>
            <CardHeader>
              <CardTitle>Slowest Runs</CardTitle>
              <CardDescription>Top 10 runs by latency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.topRuns
                  .sort((a, b) => b.latency - a.latency)
                  .slice(0, 10)
                  .map((run, index) => (
                    <div
                      key={run.run_id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{run.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {run.run_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={run.latency > 5000 ? 'destructive' : 'outline'}>
                          {(run.latency / 1000).toFixed(2)}s
                        </Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {run.tokens.toLocaleString()} tokens
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Distribution by cost type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Prompt Cost</span>
                    <Badge variant="outline">
                      ${data.metrics.cost_breakdown.prompt_cost.toFixed(6)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Cost</span>
                    <Badge variant="outline">
                      ${data.metrics.cost_breakdown.completion_cost.toFixed(6)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Cost</span>
                    <Badge>${data.metrics.cost_breakdown.total_cost.toFixed(6)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cost per Run</span>
                    <Badge variant="secondary">${data.costAnalysis.cost_per_run.toFixed(6)}</Badge>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm font-medium">Daily Cost</span>
                    <Badge>${data.costAnalysis.daily_cost.toFixed(6)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weekly Cost</span>
                    <Badge>${data.costAnalysis.weekly_cost.toFixed(6)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Cost</span>
                    <Badge>${data.costAnalysis.monthly_cost.toFixed(6)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Trend</CardTitle>
                <CardDescription>Spending over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tickFormatter={(value) => `$${value.toFixed(4)}`} />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: any) => [`$${value.toFixed(6)}`, 'Cost']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total_cost"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.6}
                      name="Cost"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Most Expensive Runs */}
          <Card>
            <CardHeader>
              <CardTitle>Most Expensive Runs</CardTitle>
              <CardDescription>Top 5 runs by cost</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.costAnalysis.top_expensive_runs.map((run, index) => (
                  <div
                    key={run.run_id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{run.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(run.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={run.cost > 0.01 ? 'destructive' : 'outline'}>
                      ${run.cost.toFixed(6)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Token Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Token Usage Over Time</CardTitle>
              <CardDescription>Token consumption trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total_tokens"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="Tokens"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {/* Error Analysis */}
          {data.errorAnalysis.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Error Distribution</CardTitle>
                  <CardDescription>Breakdown by error type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.errorAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="error_type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#ef4444" name="Error Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {data.errorAnalysis.map((errorGroup) => (
                  <Card key={errorGroup.error_type}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{errorGroup.error_type}</CardTitle>
                          <CardDescription>
                            {errorGroup.count} occurrences ({errorGroup.percentage.toFixed(2)}%)
                          </CardDescription>
                        </div>
                        <Badge variant="destructive">{errorGroup.count}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {errorGroup.recent_errors.map((error) => (
                          <div
                            key={error.run_id}
                            className="rounded-lg border bg-red-50 p-3 dark:bg-red-950/20"
                          >
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                              {error.error_message}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                Run: {error.run_id.slice(0, 8)}... | Trace:{' '}
                                {error.trace_id.slice(0, 8)}...
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(error.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
                <h3 className="mb-2 text-lg font-semibold">No Errors Found</h3>
                <p className="text-muted-foreground">
                  All runs completed successfully in the selected time range.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Runs</CardTitle>
              <CardDescription>Last 20 AI runs with details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentRuns.map((run) => (
                  <div key={run.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{run.name}</h4>
                          <Badge
                            variant={
                              run.status === 'success'
                                ? 'default'
                                : run.status === 'error'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {run.status}
                          </Badge>
                          <Badge variant="outline">{run.run_type}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          ID: {run.id} | Trace: {run.trace_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(run.start_time).toLocaleString()}
                        </p>
                        {run.latency && (
                          <p className="text-xs text-muted-foreground">
                            {(run.latency / 1000).toFixed(2)}s
                          </p>
                        )}
                      </div>
                    </div>

                    {run.error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{run.error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                      {run.total_tokens && (
                        <div>
                          <span className="text-muted-foreground">Tokens:</span>{' '}
                          <span className="font-medium">{run.total_tokens.toLocaleString()}</span>
                        </div>
                      )}
                      {run.total_cost && (
                        <div>
                          <span className="text-muted-foreground">Cost:</span>{' '}
                          <span className="font-medium">${run.total_cost.toFixed(6)}</span>
                        </div>
                      )}
                      {run.session_name && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Session:</span>{' '}
                          <span className="font-medium">{run.session_name}</span>
                        </div>
                      )}
                    </div>

                    {run.tags && run.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {run.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
