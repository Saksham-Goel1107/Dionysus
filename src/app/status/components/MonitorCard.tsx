'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { ExternalLink, ArrowUpRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type Monitor } from '../types';

interface MonitorCardProps {
  monitor: Monitor;
  getStatusColor: (status: number) => string;
  getStatusBadge: (status: number) => string;
}

export default function MonitorCard({ monitor, getStatusColor, getStatusBadge }: MonitorCardProps) {
  const statusText = getMonitorStatusText(monitor.status);
  const badgeVariant = getStatusBadge(monitor.status);
  const uptime = parseFloat(monitor.all_time_uptime_ratio as any) || 0;
  const lastChecked =
    typeof monitor.last_check === 'number' && monitor.last_check > 0
      ? new Date(monitor.last_check * 1000)
      : null;

  function getMonitorStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Paused';
      case 1:
        return 'Not checked yet';
      case 2:
        return 'Up';
      case 8:
        return 'Seems down';
      case 9:
        return 'Down';
      default:
        return 'Unknown';
    }
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className={`h-1 ${getStatusColor(monitor.status)}`} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="truncate">{monitor.friendly_name}</CardTitle>
          <Badge variant={badgeVariant as any}>{statusText}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">{uptime}%</span>
            </div>
            <Progress value={uptime} className="h-1" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Response</p>
              <p className="font-medium">{monitor.average_response_time} ms</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{getMonitorType(monitor.type)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {lastChecked ? (
                <span>Last checked {formatDistanceToNow(lastChecked, { addSuffix: true })}</span>
              ) : (
                <span>Never checked</span>
              )}
            </div>
            <a
              href="https://stats.uptimerobot.com/wKGC8z1EG2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-medium text-primary hover:underline"
            >
              View <ArrowUpRight className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getMonitorType(type: number): string {
  switch (type) {
    case 1:
      return 'HTTP(s)';
    case 2:
      return 'Keyword';
    case 3:
      return 'Ping';
    case 4:
      return 'Port';
    case 5:
      return 'Heartbeat';
    default:
      return 'Unknown';
  }
}
