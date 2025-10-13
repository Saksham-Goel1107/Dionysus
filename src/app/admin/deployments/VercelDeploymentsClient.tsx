'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import DeploymentStats from './DeploymentStats';

interface Deployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  target?: 'production' | 'staging' | 'preview' | null;
  creator?: {
    username?: string;
    email?: string;
  };
  meta?: Record<string, string>;
  buildingAt?: number;
  ready?: number;
}

interface BuildLog {
  id: string;
  message: string;
  timestamp: number;
  type: 'stdout' | 'stderr' | 'command';
  source?: string;
}

const stateColors: Record<Deployment['state'], string> = {
  BUILDING: 'bg-blue-500',
  ERROR: 'bg-red-500',
  INITIALIZING: 'bg-yellow-500',
  QUEUED: 'bg-gray-500',
  READY: 'bg-green-500',
  CANCELED: 'bg-orange-500',
};

const stateIcons: Record<Deployment['state'], React.ReactNode> = {
  BUILDING: <RefreshCw className="h-4 w-4 animate-spin" />,
  ERROR: <XCircle className="h-4 w-4" />,
  INITIALIZING: <Clock className="h-4 w-4" />,
  QUEUED: <Pause className="h-4 w-4" />,
  READY: <CheckCircle2 className="h-4 w-4" />,
  CANCELED: <AlertCircle className="h-4 w-4" />,
};

export default function VercelDeploymentsClient() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteDeploymentId, setDeleteDeploymentId] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper function to format timestamps properly
  const formatTimestamp = (timestamp: number | undefined): string => {
    if (!timestamp) return 'N/A';

    // Check if timestamp is in seconds (typical for Vercel API)
    const ts = timestamp < 10000000000 ? timestamp * 1000 : timestamp;

    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDuration = (start?: number, end?: number): string => {
    if (!start || !end) return 'N/A';
    const startTs = start < 10000000000 ? start * 1000 : start;
    const endTs = end < 10000000000 ? end * 1000 : end;
    const duration = endTs - startTs;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`,
    });
  };

  const downloadLogs = () => {
    if (logs.length === 0) return;

    const logText = logs
      .map((log) => {
        const timestamp = formatTimestamp(log.timestamp);
        return `[${timestamp}] [${log.type}] ${log.message}`;
      })
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-${selectedDeployment?.uid}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Logs downloaded successfully.',
    });
  };

  const fetchDeployments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '50' });
      if (stateFilter !== 'all') {
        params.set('state', stateFilter);
      }

      const response = await fetch(`/api/admin/vercel/deployments?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch deployments');

      const data = await response.json();
      setDeployments(data.deployments || []);
    } catch (error) {
      console.error('Error fetching deployments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch deployments. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [stateFilter, toast]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDeployments();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchDeployments]);

  const fetchLogs = async (deploymentId: string) => {
    try {
      setLogsLoading(true);
      const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}/logs`);
      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      // Ensure logs have proper structure and valid timestamps
      const validLogs = (data.logs || []).filter((log: BuildLog) => {
        return log && log.message && typeof log.timestamp === 'number';
      });
      setLogs(validLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Logs Unavailable',
        description: 'Build logs may not be available on the free plan or for this deployment.',
        variant: 'default',
      });
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleViewDetails = async (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setShowDetailsDialog(true);
    await fetchLogs(deployment.uid);
  };

  const handleRedeploy = async (deploymentId: string) => {
    try {
      setActionLoading(deploymentId);
      const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}/redeploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'production' }),
      });

      if (!response.ok) throw new Error('Failed to redeploy');

      toast({
        title: 'Success',
        description: 'Deployment initiated successfully.',
      });

      await fetchDeployments();
    } catch (error) {
      console.error('Error redeploying:', error);
      toast({
        title: 'Error',
        description: 'Failed to redeploy. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (deploymentId: string) => {
    try {
      setActionLoading(deploymentId);
      const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to cancel');

      toast({
        title: 'Success',
        description: 'Deployment canceled successfully.',
      });

      await fetchDeployments();
    } catch (error) {
      console.error('Error canceling:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel deployment.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (deploymentId: string) => {
    setDeleteDeploymentId(deploymentId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteDeploymentId) return;

    try {
      setActionLoading(deleteDeploymentId);
      const response = await fetch(`/api/admin/vercel/deployments/${deleteDeploymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({
        title: 'Success',
        description: 'Deployment deleted successfully.',
      });

      await fetchDeployments();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete deployment.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
      setShowDeleteDialog(false);
      setDeleteDeploymentId(null);
    }
  };

  const handlePromote = async (deploymentId: string) => {
    try {
      setActionLoading(deploymentId);
      const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}/promote`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to promote');

      toast({
        title: 'Success',
        description: 'Deployment promoted to production.',
      });

      await fetchDeployments();
    } catch (error) {
      console.error('Error promoting:', error);
      toast({
        title: 'Error',
        description: 'Failed to promote deployment.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDeployments = deployments.filter((deployment) => {
    const matchesSearch =
      deployment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deployment.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deployment.uid.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTarget =
      targetFilter === 'all' ||
      deployment.target === targetFilter ||
      (targetFilter === 'preview' && !deployment.target);

    return matchesSearch && matchesTarget;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vercel Deployments</h1>
          <p className="text-muted-foreground">Manage and monitor your Vercel deployments</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>
          <Button onClick={fetchDeployments} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <DeploymentStats />

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, URL, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="BUILDING">Building</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={targetFilter} onValueChange={setTargetFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Targets</SelectItem>
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="preview">Preview</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredDeployments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No deployments found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || stateFilter !== 'all' || targetFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No deployments available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDeployments.map((deployment) => (
            <Card key={deployment.uid} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{deployment.name}</CardTitle>
                      <Badge
                        className={`${stateColors[deployment.state]} flex items-center gap-1 text-white`}
                      >
                        {stateIcons[deployment.state]}
                        {deployment.state}
                      </Badge>
                      {deployment.target && (
                        <Badge variant="outline" className="capitalize">
                          {deployment.target}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs">{deployment.uid}</span>
                      <span>•</span>
                      <span>{formatTimestamp(deployment.created)}</span>
                      {deployment.buildingAt && deployment.ready && (
                        <>
                          <span>•</span>
                          <span className="text-xs">
                            Build time: {formatDuration(deployment.buildingAt, deployment.ready)}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={!!actionLoading}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Deployment Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => window.open(`https://${deployment.url}`, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Deployment
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewDetails(deployment)}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Details & Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyToClipboard(deployment.url, 'URL')}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => copyToClipboard(deployment.uid, 'Deployment ID')}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRedeploy(deployment.uid)}
                        disabled={!!actionLoading}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Redeploy
                      </DropdownMenuItem>
                      {deployment.target !== 'production' && deployment.state === 'READY' && (
                        <DropdownMenuItem
                          onClick={() => handlePromote(deployment.uid)}
                          disabled={!!actionLoading}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Promote to Production
                        </DropdownMenuItem>
                      )}
                      {(deployment.state === 'BUILDING' || deployment.state === 'QUEUED') && (
                        <DropdownMenuItem
                          onClick={() => handleCancel(deployment.uid)}
                          disabled={!!actionLoading}
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Cancel Build
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(deployment.uid)}
                        className="text-red-600 focus:text-red-600 dark:text-red-400"
                        disabled={!!actionLoading}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Deployment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`https://${deployment.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {deployment.url}
                  </a>
                </div>
                {deployment.creator && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Deployed by {deployment.creator.username || deployment.creator.email}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Deployment Details
            </DialogTitle>
            <DialogDescription className="mt-1 truncate">
              {selectedDeployment?.name} - {selectedDeployment?.uid}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="logs">Build Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Status</h4>
                  <Badge
                    className={`${stateColors[selectedDeployment?.state ?? 'QUEUED']} text-white`}
                  >
                    {selectedDeployment?.state}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Target</h4>
                  <p className="text-sm capitalize">{selectedDeployment?.target || 'Preview'}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Created</h4>
                  <p className="text-sm">{formatTimestamp(selectedDeployment?.created)}</p>
                </div>
                {selectedDeployment?.buildingAt && selectedDeployment?.ready && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Build Duration</h4>
                    <p className="text-sm">
                      {formatDuration(selectedDeployment.buildingAt, selectedDeployment.ready)}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">URL</h4>
                  <a
                    href={`https://${selectedDeployment?.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {selectedDeployment?.url}
                  </a>
                </div>
                {selectedDeployment?.creator && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Deployed By</h4>
                    <p className="text-sm">
                      {selectedDeployment.creator.username || selectedDeployment.creator.email}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="logs"
              className="flex flex-1 flex-col space-y-3 overflow-hidden px-6 py-4 data-[state=active]:flex"
            >
              <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-sm text-muted-foreground">
                  {logs.length} log {logs.length === 1 ? 'entry' : 'entries'}
                </p>
                {logs.length > 0 && (
                  <Button size="sm" variant="outline" onClick={downloadLogs}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[400px] w-full rounded-md border bg-slate-950 p-4">
                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-white" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="mb-2 h-8 w-8 text-yellow-500" />
                    <p className="text-white">No logs available</p>
                    <p className="mt-2 text-sm text-gray-400">
                      Build logs may not be accessible on the free Vercel plan or for this
                      deployment.
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Check the Vercel dashboard for complete logs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 font-mono text-xs">
                    {logs.map((log, index) => (
                      <div
                        key={`${log.id}-${index}`}
                        className={`break-words ${
                          log.type === 'stderr'
                            ? 'text-red-400'
                            : log.type === 'command'
                              ? 'text-green-400'
                              : 'text-gray-300'
                        }`}
                      >
                        <span className="text-gray-500">
                          [{formatTimestamp(log.timestamp)}]
                        </span>{' '}
                        <span className="text-blue-400">[{log.type}]</span> {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            {selectedDeployment && (
              <Button onClick={() => window.open(`https://${selectedDeployment.url}`, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Deployment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deployment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this deployment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={!!actionLoading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
