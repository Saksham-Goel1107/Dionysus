'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Archive,
  Bug,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Terminal,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
  isPublic: boolean;
  platform: string;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  metadata: {
    type: string;
    value: string;
    filename?: string;
  };
  stats?: {
    '24h': Array<[number, number]>;
  };
}

interface SentryProject {
  id: string;
  name: string;
  slug: string;
  platform: string;
  dateCreated: string;
  status: string;
}

interface ErrorTrackingDashboardProps {
  issues: SentryIssue[];
  projects: SentryProject[];
  error: string | null;
  orgSlug: string;
}

export default function ErrorTrackingDashboard({
  issues,
  projects,
  error,
  orgSlug,
}: ErrorTrackingDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'lastSeen' | 'count' | 'users'>('lastSeen');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<SentryIssue | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionComment, setActionComment] = useState('');
  const [localIssues, setLocalIssues] = useState(issues);

  // Calculate statistics
  const totalErrors = useMemo(() => {
    return localIssues.reduce((sum, issue) => sum + parseInt(issue.count || '0', 10), 0);
  }, [localIssues]);

  const totalUsers = useMemo(() => {
    return localIssues.reduce((sum, issue) => sum + (issue.userCount || 0), 0);
  }, [localIssues]);

  const unresolvedIssues = useMemo(() => {
    return localIssues.filter((issue) => issue.status === 'unresolved').length;
  }, [localIssues]);

  const criticalIssues = useMemo(() => {
    return localIssues.filter((issue) => issue.level === 'error' || issue.level === 'fatal').length;
  }, [localIssues]);

  // Filter and sort issues
  const filteredIssues = useMemo(() => {
    let filtered = localIssues;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.culprit.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.shortId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.metadata?.value?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter((issue) => issue.level === levelFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((issue) => issue.status === statusFilter);
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter((issue) => issue.project?.slug === projectFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'lastSeen') {
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      } else if (sortBy === 'count') {
        return parseInt(b.count || '0', 10) - parseInt(a.count || '0', 10);
      } else {
        return (b.userCount || 0) - (a.userCount || 0);
      }
    });

    return filtered;
  }, [localIssues, searchQuery, levelFilter, statusFilter, projectFilter, sortBy]);

  // Action handlers
  const handleIssueAction = async (
    issueId: string,
    action: 'resolved' | 'ignored' | 'unresolved' | 'deleted',
  ) => {
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/admin/sentry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, action, comment: actionComment }),
      });

      if (!response.ok) {
        throw new Error('Failed to update issue');
      }

      // Update local state
      setLocalIssues((prev) =>
        action === 'deleted'
          ? prev.filter((issue) => issue.id !== issueId)
          : prev.map((issue) => (issue.id === issueId ? { ...issue, status: action } : issue)),
      );

      toast({
        title: 'Success',
        description: `Issue ${action === 'deleted' ? 'deleted' : action} successfully`,
      });

      setActionComment('');
      setIsDetailDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update issue',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const openIssueDetails = (issue: SentryIssue) => {
    setSelectedIssue(issue);
    setIsDetailDialogOpen(true);
  };

  const copyIssueAsMarkdown = (issue: SentryIssue) => {
    const markdown = `# Error Report: ${issue.title || issue.metadata?.value || 'Untitled Error'}

## Overview
- **Issue ID**: ${issue.shortId}
- **Status**: ${issue.status}
- **Level**: ${issue.level}
- **Platform**: ${issue.platform}
${issue.project ? `- **Project**: ${issue.project.name}` : ''}

## Statistics
- **Total Events**: ${parseInt(issue.count || '0').toLocaleString()}
- **Users Affected**: ${issue.userCount || 0}
- **First Seen**: ${new Date(issue.firstSeen).toLocaleString()}
- **Last Seen**: ${new Date(issue.lastSeen).toLocaleString()}

## Error Details
- **Type**: ${issue.metadata?.type || 'Unknown'}
${issue.culprit ? `- **Location**: \`${issue.culprit}\`` : ''}
${issue.metadata?.filename ? `- **File**: \`${issue.metadata.filename}\`` : ''}

## Error Message
\`\`\`
${issue.metadata?.value || 'No error message available'}
\`\`\`

## Links
- **Sentry**: ${issue.permalink}

---
*Generated on ${new Date().toLocaleString()}*
`;

    navigator.clipboard
      .writeText(markdown)
      .then(() => {
        toast({
          title: 'Copied to clipboard',
          description: 'Error details copied as Markdown format',
        });
      })
      .catch((err) => {
        toast({
          title: 'Failed to copy',
          description: 'Could not copy to clipboard',
          variant: 'destructive',
        });
        console.error('Failed to copy:', err);
      });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
      case 'fatal':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadgeColor = (
    level: string,
  ): 'default' | 'secondary' | 'destructive' | 'warning' | 'outline' => {
    switch (level) {
      case 'error':
      case 'fatal':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'info':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Error Loading Sentry Data
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-300">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Please ensure the following environment variables are set:
            </p>
            <ul className="mb-4 list-inside list-disc space-y-1 text-sm">
              <li>SENTRY_AUTH_TOKEN</li>
              <li>SENTRY_ORG_SLUG (default: saksham-vj)</li>
            </ul>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Error Tracking Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor, manage, and resolve application errors in real-time
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <Bug className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalErrors.toLocaleString()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last 14 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unresolved Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unresolvedIssues}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {issues.length} total issues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unique users impacted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalIssues}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Error/Fatal level</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">Issues ({filteredIssues.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-6">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects ({localIssues.length})</SelectItem>
                    {projects.map((project) => {
                      const projectIssueCount = localIssues.filter(
                        (issue) => issue.project?.slug === project.slug,
                      ).length;
                      return (
                        <SelectItem key={project.id} value={project.slug}>
                          {project.name} ({projectIssueCount})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="fatal">Fatal</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="unresolved">Unresolved</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastSeen">Last Seen</SelectItem>
                    <SelectItem value="count">Event Count</SelectItem>
                    <SelectItem value="users">User Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          <div className="space-y-3">
            {filteredIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
                  <h3 className="mb-2 text-lg font-semibold">No Issues Found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery || levelFilter !== 'all' || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'All systems operational!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredIssues.map((issue) => (
                <Card
                  key={issue.id}
                  className="transition-shadow hover:shadow-md dark:hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Issue Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {getLevelIcon(issue.level)}
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {issue.title || issue.metadata?.value || 'Untitled Error'}
                            </h3>
                            <Badge variant={getLevelBadgeColor(issue.level)}>{issue.level}</Badge>
                            <Badge variant="outline">{issue.shortId}</Badge>
                            {issue.project && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                {issue.project.name}
                              </Badge>
                            )}
                            {issue.status !== 'unresolved' && (
                              <Badge
                                variant={issue.status === 'resolved' ? 'default' : 'secondary'}
                              >
                                {issue.status}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              <span>{parseInt(issue.count || '0').toLocaleString()} events</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{issue.userCount || 0} users</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Last seen: {formatDate(issue.lastSeen)}</span>
                            </div>
                          </div>

                          {issue.culprit && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Location:</span> {issue.culprit}
                            </p>
                          )}

                          {issue.metadata?.filename && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">File:</span> {issue.metadata.filename}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyIssueAsMarkdown(issue)}
                            title="Copy as Markdown"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openIssueDetails(issue)}
                            title="View full details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(issue.permalink, '_blank')}
                            title="Open in Sentry"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2">
                        {issue.status !== 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIssueAction(issue.id, 'resolved')}
                            disabled={isActionLoading}
                            className="text-green-600 hover:bg-green-50 hover:text-green-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Resolve
                          </Button>
                        )}
                        {issue.status === 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIssueAction(issue.id, 'unresolved')}
                            disabled={isActionLoading}
                            className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Reopen
                          </Button>
                        )}
                        {issue.status !== 'ignored' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIssueAction(issue.id, 'ignored')}
                            disabled={isActionLoading}
                            className="text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <EyeOff className="mr-1 h-3 w-3" />
                            Ignore
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIssueAction(issue.id, 'deleted')}
                          disabled={isActionLoading}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>

                      {/* Expandable Details */}
                      {expandedIssue === issue.id && (
                        <div className="space-y-3 border-t pt-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Error Type
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {issue.metadata?.type || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Platform
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {issue.platform}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                First Seen
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(issue.firstSeen).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Last Seen
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(issue.lastSeen).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {issue.metadata?.value && (
                            <div>
                              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Error Message
                              </p>
                              <pre className="overflow-x-auto rounded-md bg-gray-100 p-3 text-xs dark:bg-gray-800">
                                {issue.metadata.value}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Toggle Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedIssue(expandedIssue === issue.id ? null : issue.id)
                        }
                        className="w-full"
                      >
                        {expandedIssue === issue.id ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Show More Details
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{project.name}</span>
                    <Badge variant="outline">{project.platform}</Badge>
                  </CardTitle>
                  <CardDescription>Slug: {project.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <Badge
                        variant={project.status === 'active' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(project.dateCreated).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() =>
                      window.open(
                        `https://sentry.io/organizations/${orgSlug}/projects/${project.slug}/`,
                        '_blank',
                      )
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View in Sentry
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed Issue Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="flex items-center gap-2">
                  {selectedIssue && getLevelIcon(selectedIssue.level)}
                  {selectedIssue?.title || selectedIssue?.metadata?.value || 'Issue Details'}
                </DialogTitle>
                <DialogDescription>
                  {selectedIssue?.shortId} • {selectedIssue?.platform}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedIssue && copyIssueAsMarkdown(selectedIssue)}
                title="Copy as Markdown"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy as Markdown
              </Button>
            </div>
          </DialogHeader>

          {selectedIssue && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Status and Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserCog className="h-4 w-4" />
                      Issue Status & Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getLevelBadgeColor(selectedIssue.level)} className="text-sm">
                        {selectedIssue.level}
                      </Badge>
                      <Badge
                        variant={selectedIssue.status === 'resolved' ? 'default' : 'outline'}
                        className="text-sm"
                      >
                        {selectedIssue.status}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Perform Action:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedIssue.status !== 'resolved' && (
                          <Button
                            onClick={() => handleIssueAction(selectedIssue.id, 'resolved')}
                            disabled={isActionLoading}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isActionLoading ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                            )}
                            Mark as Resolved
                          </Button>
                        )}
                        {selectedIssue.status === 'resolved' && (
                          <Button
                            onClick={() => handleIssueAction(selectedIssue.id, 'unresolved')}
                            disabled={isActionLoading}
                            size="sm"
                            variant="outline"
                          >
                            {isActionLoading ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="mr-1 h-3 w-3" />
                            )}
                            Reopen Issue
                          </Button>
                        )}
                        {selectedIssue.status !== 'ignored' && (
                          <Button
                            onClick={() => handleIssueAction(selectedIssue.id, 'ignored')}
                            disabled={isActionLoading}
                            size="sm"
                            variant="outline"
                          >
                            {isActionLoading ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Archive className="mr-1 h-3 w-3" />
                            )}
                            Ignore Issue
                          </Button>
                        )}
                        <Button
                          onClick={() => handleIssueAction(selectedIssue.id, 'deleted')}
                          disabled={isActionLoading}
                          size="sm"
                          variant="destructive"
                        >
                          {isActionLoading ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-3 w-3" />
                          )}
                          Delete Issue
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Add Comment (Optional):</label>
                        <Textarea
                          placeholder="Add a comment about this action..."
                          value={actionComment}
                          onChange={(e) => setActionComment(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Info className="h-4 w-4" />
                      Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedIssue.project && (
                        <div>
                          <p className="mb-1 text-sm font-medium text-muted-foreground">Project</p>
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {selectedIssue.project.name}
                          </Badge>
                        </div>
                      )}
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">
                          Event Count
                        </p>
                        <p className="text-lg font-semibold">
                          {parseInt(selectedIssue.count || '0').toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">
                          Users Affected
                        </p>
                        <p className="text-lg font-semibold">{selectedIssue.userCount || 0}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">First Seen</p>
                        <p className="text-sm">
                          {new Date(selectedIssue.firstSeen).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">Last Seen</p>
                        <p className="text-sm">
                          {new Date(selectedIssue.lastSeen).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Error Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bug className="h-4 w-4" />
                      Error Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="mb-1 text-sm font-medium text-muted-foreground">Error Type</p>
                      <p className="text-sm">{selectedIssue.metadata?.type || 'Unknown'}</p>
                    </div>
                    {selectedIssue.metadata?.value && (
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">
                          Error Message
                        </p>
                        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                          {selectedIssue.metadata.value}
                        </pre>
                      </div>
                    )}
                    {selectedIssue.culprit && (
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">Location</p>
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {selectedIssue.culprit}
                        </code>
                      </div>
                    )}
                    {selectedIssue.metadata?.filename && (
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">Filename</p>
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {selectedIssue.metadata.filename}
                        </code>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Additional Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">Platform</p>
                        <p className="text-sm">{selectedIssue.platform}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">Issue ID</p>
                        <p className="font-mono text-sm">{selectedIssue.shortId}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">Visibility</p>
                        <Badge variant="outline">
                          {selectedIssue.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                      <div>
                        <p className="mb-1 text-sm font-medium text-muted-foreground">
                          External Link
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-blue-600"
                          onClick={() => window.open(selectedIssue.permalink, '_blank')}
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          View in Sentry
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions Guide */}
                <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-blue-700 dark:text-blue-400">
                      <Terminal className="h-4 w-4" />
                      Quick Actions Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-blue-900 dark:text-blue-300">
                    <p>
                      <strong>Resolve:</strong> Mark the issue as fixed when you&apos;ve deployed a
                      solution
                    </p>
                    <p>
                      <strong>Reopen:</strong> Restore a resolved issue if it occurs again
                    </p>
                    <p>
                      <strong>Ignore:</strong> Hide non-critical issues from your main view
                    </p>
                    <p>
                      <strong>Delete:</strong> Permanently remove the issue (use with caution)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
