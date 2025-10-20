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
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  MessageSquare,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  User,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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

  // Reported messages state
  const [reportsData, setReportsData] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportsStatusFilter, setReportsStatusFilter] = useState('all');
  const [reportsOffset, setReportsOffset] = useState(0);

  const fetchData = useCallback(async () => {
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
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [timeRange,fetchData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchData();
      }, 60000); // Refresh every minute

      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange,fetchData]);

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

  const fetchReportsData = useCallback(async () => {
    try {
      setReportsLoading(true);
      setReportsError(null);
      const response = await fetch(
        `/api/admin/reported-messages?status=${reportsStatusFilter}&limit=50&offset=${reportsOffset}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch reported messages');
      }

      setReportsData(result.data);
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching reported messages:', err);
    } finally {
      setReportsLoading(false);
    }
  }, [reportsStatusFilter, reportsOffset]);

  const updateReportStatus = async (reportId: string, status: string, resolution?: string) => {
    try {
      const response = await fetch('/api/admin/reported-messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId, status, resolution }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update report: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update report');
      }

      // Refresh the reports data
      fetchReportsData();
    } catch (err) {
      console.error('Error updating report:', err);
      // You might want to show a toast notification here
    }
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

  // Reported Messages Tab Component
  const ReportedMessagesTab = () => {
    useEffect(() => {
      fetchReportsData();
    }, []); // Empty dependency array - only run on mount

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'reviewed':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'resolved':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'dismissed':
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      }
    };

    const getReasonIcon = (reason: string) => {
      switch (reason) {
        case 'inappropriate':
          return <AlertTriangle className="h-4 w-4 text-red-500" />;
        case 'harmful':
          return <XCircle className="h-4 w-4 text-red-600" />;
        case 'inaccurate':
          return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        case 'offensive':
          return <MessageSquare className="h-4 w-4 text-orange-500" />;
        default:
          return <AlertCircle className="h-4 w-4 text-gray-500" />;
      }
    };

    if (reportsLoading && !reportsData) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      );
    }

    if (reportsError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {reportsError}
            <Button onClick={fetchReportsData} variant="outline" size="sm" className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Reported Messages</h2>
            <p className="mt-1 text-muted-foreground">
              Review and manage user-reported messages
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={reportsStatusFilter} onValueChange={setReportsStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchReportsData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {reportsData && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportsData.pagination.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {reportsData.reports.filter((r: any) => r.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportsData.reports.filter((r: any) => r.status === 'resolved').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dismissed</CardTitle>
                <XCircle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {reportsData.reports.filter((r: any) => r.status === 'dismissed').length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          {reportsData?.reports.map((report: any) => (
            <Card key={report.id} className="p-6">
              <div className="space-y-4">
                {/* Report Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getReasonIcon(report.reason)}
                    <div>
                      <h3 className="font-semibold capitalize">{report.reason.replace('_', ' ')}</h3>
                      <p className="text-sm text-muted-foreground">
                        Reported by {report.reporter.firstName} {report.reporter.lastName} ({report.reporter.email})
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                </div>

                {/* Report Details */}
                {report.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description:</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {report.description}
                    </p>
                  </div>
                )}

                {/* Message Details */}
                <div className="border-l-4 border-blue-200 pl-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-r-md">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {report.message.role === 'user' ? 'User Message' : 'Assistant Response'}
                    </span>
                    {report.message.model && (
                      <Badge variant="outline" className="text-xs">
                        {report.message.model}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{report.message.content}</p>
                  {report.message.attachments && report.message.attachments.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">Attachments: </span>
                      <span className="text-xs">{report.message.attachments.length} files</span>
                    </div>
                  )}
                </div>

                {/* Author and Session Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    <span>Author: {report.author.firstName} {report.author.lastName}</span>
                    <span className="mx-2">•</span>
                    <span>Session: {report.session.title || `Session ${report.session.id.slice(-8)}`}</span>
                  </div>
                  <div>
                    Reported: {new Date(report.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Admin Actions */}
                {report.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReportStatus(report.id, 'reviewed')}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Mark as Reviewed
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateReportStatus(report.id, 'resolved', 'Issue resolved')}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateReportStatus(report.id, 'dismissed', 'Report dismissed')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                )}

                {/* Resolution */}
                {report.resolution && (
                  <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-md border-l-4 border-green-400">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-1">
                      Resolution:
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">{report.resolution}</p>
                    {report.reviewedAt && (
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        Resolved on {new Date(report.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}

          {reportsData?.reports.length === 0 && (
            <Card className="p-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
              <p className="text-muted-foreground">
                {reportsStatusFilter === 'all'
                  ? 'There are no reported messages yet.'
                  : `No ${reportsStatusFilter} reports found.`}
              </p>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {reportsData?.pagination.hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setReportsOffset(reportsOffset + 50)}
              disabled={reportsLoading}
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    );
  };

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

      {/* Warning for no data */}
      {data.metrics.total_runs === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-400">
              No Data Available
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-500">
              There are no LangSmith runs recorded for the selected time period.
            </AlertDescription>
          </Alert>

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                <AlertCircle className="h-5 w-5" />
                Getting Started with LangSmith
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 dark:text-blue-300">
              <p className="mb-2">To start seeing data here, ensure:</p>
              <ol className="ml-4 list-decimal space-y-1">
                <li>LangChain is installed in your application</li>
                <li>LANGCHAIN_API_KEY environment variable is set</li>
                <li>LANGCHAIN_TRACING_V2=true is enabled</li>
                <li>Your application is actively making LangChain calls</li>
              </ol>
              <p className="mt-3">
                <a
                  href="https://docs.smith.langchain.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  View LangSmith Documentation →
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
              {data.metrics.total_tokens === 0
                ? '0.0K'
                : data.metrics.total_tokens >= 1000000
                  ? `${(data.metrics.total_tokens / 1000000).toFixed(1)}M`
                  : `${(data.metrics.total_tokens / 1000).toFixed(1)}K`}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.metrics.token_usage.prompt_tokens === 0 &&
              data.metrics.token_usage.completion_tokens === 0
                ? 'No token usage data'
                : `Prompt: ${(data.metrics.token_usage.prompt_tokens / 1000).toFixed(1)}K, Completion: ${(data.metrics.token_usage.completion_tokens / 1000).toFixed(1)}K`}
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
              {data.metrics.total_runs > 0
                ? ((data.metrics.failed_runs / data.metrics.total_runs) * 100).toFixed(2)
                : '0.00'}
              %
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
          <TabsTrigger value="reports">Reported Messages</TabsTrigger>
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
                {data.metrics.total_runs === 0 ? (
                  <div className="flex h-[250px] items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No run data available for this time period
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'LLM', value: data.metrics.runs_by_type.llm },
                          { name: 'Chain', value: data.metrics.runs_by_type.chain },
                          { name: 'Tool', value: data.metrics.runs_by_type.tool },
                          { name: 'Retriever', value: data.metrics.runs_by_type.retriever },
                          { name: 'Prompt', value: data.metrics.runs_by_type.prompt },
                        ].filter((item) => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value, percent }) =>
                          percent > 0.05
                            ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                            : ''
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'LLM', value: data.metrics.runs_by_type.llm },
                          { name: 'Chain', value: data.metrics.runs_by_type.chain },
                          { name: 'Tool', value: data.metrics.runs_by_type.tool },
                          { name: 'Retriever', value: data.metrics.runs_by_type.retriever },
                          { name: 'Prompt', value: data.metrics.runs_by_type.prompt },
                        ]
                          .filter((item) => item.value > 0)
                          .map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} runs`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Success vs errors vs pending</CardDescription>
              </CardHeader>
              <CardContent>
                {data.metrics.total_runs === 0 ? (
                  <div className="flex h-[250px] items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No run data available for this time period
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Success', value: data.metrics.runs_by_status.success },
                          { name: 'Error', value: data.metrics.runs_by_status.error },
                          { name: 'Pending', value: data.metrics.runs_by_status.pending },
                        ].filter((item) => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} runs`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
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

        <TabsContent value="reports" className="space-y-4">
          <ReportedMessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
