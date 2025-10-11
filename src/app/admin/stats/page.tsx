'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Network,
  Server,
  Thermometer,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
export default function StatsPage() {
  const [refreshInterval] = useState(5000); // 5 seconds

  const {
    data: stats,
    isLoading,
    error,
  } = api.stats.getSystemStats.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  const { data: health, isLoading: healthLoading } = api.stats.getHealthCheck.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (speed: number) => {
    return `${(speed || 0).toFixed(2)} GHz`;
  };

  const formatNetworkBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error Loading System Stats</h1>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Statistics</h1>
          <p className="text-muted-foreground">Real-time hardware monitoring and health checks</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Auto-refresh: {refreshInterval / 1000}s
          </Badge>
          {health && (
            <Badge className={`flex items-center gap-1 ${getHealthColor(health.status)}`}>
              {getHealthIcon(health.status)}
              {health.status.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Response times and system performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : stats?.timing ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-muted-foreground">API Response</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.timing.responseTime}ms</p>
                <p className="text-xs text-muted-foreground">Total response time</p>
              </div>
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Server className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-muted-foreground">Database</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.timing.dbResponseTime}ms</p>
                <p className="text-xs text-muted-foreground">DB query time</p>
              </div>
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                </div>
                <p className="text-lg font-semibold text-purple-600">
                  {new Date(stats.timing.timestamp).toLocaleTimeString()}
                </p>
                <p className="text-xs text-muted-foreground">Real-time data</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* CPU Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            CPU Information
          </CardTitle>
          <CardDescription>Processor details and current usage</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Model</p>
                  <p className="font-semibold">{stats.cpu.brand}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cores</p>
                  <p className="font-semibold">
                    {stats.cpu.cores} ({stats.cpu.physicalCores} physical)
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Speed</p>
                  <p className="font-semibold">{formatSpeed(stats.cpu.speed)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Governor</p>
                  <p className="font-semibold">{stats.cpu.governor || 'N/A'}</p>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-muted-foreground">
                    {(stats.cpu.usage || 0).toFixed(1)}%
                  </span>
                </div>
                <Progress value={stats.cpu.usage || 0} className="h-2" />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Memory Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MemoryStick className="h-5 w-5" />
            Memory Information
          </CardTitle>
          <CardDescription>RAM usage and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="font-semibold">{formatBytes(stats.memory.total)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Used</p>
                  <p className="font-semibold">{formatBytes(stats.memory.used)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Free</p>
                  <p className="font-semibold">{formatBytes(stats.memory.free)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="font-semibold">{formatBytes(stats.memory.available)}</p>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.memory.total
                      ? ((stats.memory.used / stats.memory.total) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </span>
                </div>
                <Progress
                  value={stats.memory.total ? (stats.memory.used / stats.memory.total) * 100 : 0}
                  className="h-2"
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Disk Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Information
          </CardTitle>
          <CardDescription>Disk usage across all mounted filesystems</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : stats ? (
            <div className="space-y-4">
              {stats.disk.slice(0, 5).map((disk, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {disk.mount} ({disk.type})
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {(disk.use || 0).toFixed(1)}% used
                    </span>
                  </div>
                  <Progress value={disk.use || 0} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(disk.used)} used of {formatBytes(disk.size)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Network Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Interfaces
          </CardTitle>
          <CardDescription>Network interface statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : stats ? (
            <div className="space-y-4">
              {stats.network.slice(0, 3).map((net, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{net.iface}</span>
                    <Badge variant={net.operstate === 'up' ? 'default' : 'secondary'}>
                      {net.operstate}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Received</p>
                      <p className="font-semibold">{formatNetworkBytes(net.rx_bytes || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transmitted</p>
                      <p className="font-semibold">{formatNetworkBytes(net.tx_bytes || 0)}</p>
                    </div>
                  </div>
                  {(net.rx_errors > 0 || net.tx_errors > 0) && (
                    <div className="mt-2 text-xs text-red-600">
                      Errors: RX {net.rx_errors}, TX {net.tx_errors}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Temperature Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Temperature Sensors
          </CardTitle>
          <CardDescription>CPU and system temperature readings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : stats ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Main</p>
                <p className="text-2xl font-bold">
                  {stats.temperature?.main !== undefined && stats.temperature?.main !== null
                    ? `${stats.temperature.main}°C`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max</p>
                <p className="text-2xl font-bold">
                  {stats.temperature?.max !== undefined && stats.temperature?.max !== null
                    ? `${stats.temperature.max}°C`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cores</p>
                <p className="text-lg font-semibold">
                  {stats.temperature?.cores &&
                  Array.isArray(stats.temperature.cores) &&
                  stats.temperature.cores.length > 0
                    ? `${Math.min(...stats.temperature.cores)}°C - ${Math.max(...stats.temperature.cores)}°C`
                    : 'N/A'}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Server Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Server Location
          </CardTitle>
          <CardDescription>Server identification and location information</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hostname</p>
                  <p className="font-semibold">{stats.os.hostname}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">FQDN</p>
                  <p className="font-semibold">{stats.os.fqdn || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Platform</p>
                  <p className="font-semibold">{stats.os.platform}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Architecture</p>
                  <p className="font-semibold">{stats.os.arch}</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Server ID:</strong> {stats.system.uuid || stats.os.hostname}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This unique identifier helps track which server is handling your requests.
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>Operating system and hardware details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : stats ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold">Operating System</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Platform:</span> {stats.os.platform}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Distribution:</span> {stats.os.distro}{' '}
                    {stats.os.release}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Kernel:</span> {stats.os.kernel}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Architecture:</span> {stats.os.arch}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Hostname:</span> {stats.os.hostname}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Hardware</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Manufacturer:</span>{' '}
                    {stats.system.manufacturer}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Model:</span> {stats.system.model}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Version:</span> {stats.system.version}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Serial:</span>{' '}
                    {stats.system.serial || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Health Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Check
          </CardTitle>
          <CardDescription>System health status and component checks</CardDescription>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : health ? (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {health.status === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : health.status === 'degraded' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-semibold">Overall Status</span>
                </div>
                <Badge
                  variant={
                    health.status === 'healthy'
                      ? 'default'
                      : health.status === 'degraded'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {health.status.toUpperCase()}
                </Badge>
              </div>

              {/* Response Time */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-sm">{health.responseTime}ms</span>
                </div>
              </div>

              {/* Component Checks */}
              <div className="space-y-3">
                <h4 className="font-medium">Component Status</h4>

                {/* Database */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        health.checks.database?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm font-medium">Database</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {health.checks.database?.responseTime}ms
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {health.checks.database?.recordCount} records
                    </div>
                  </div>
                </div>

                {/* System */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        health.checks.system?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm font-medium">System Load</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      CPU: {health.checks.system?.cpuLoad?.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Memory: {formatBytes(health.checks.system?.memoryAvailable || 0)} free
                    </div>
                  </div>
                </div>

                {/* Storage */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        health.checks.storage?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm font-medium">Storage</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {health.checks.storage?.disks?.length || 0} disks monitored
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {health.checks.storage?.disks?.filter((d: any) => d.status === 'healthy')
                        .length || 0}{' '}
                      healthy
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="border-t pt-2 text-center text-xs text-muted-foreground">
                Last checked: {new Date(health.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
