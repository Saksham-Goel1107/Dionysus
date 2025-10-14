'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Activity, Clock } from 'lucide-react';
import { Monitor } from '../types';

interface IncidentHistoryProps {
  monitors: Monitor[];
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
};

const formatIncidentReason = (reason?: { code: string; detail: string }): string => {
  if (!reason || !reason.code) {
    return 'Service unavailable';
  }

  const code = reason.code;
  const detail = reason.detail || '';

  // Handle common HTTP status codes
  switch (code) {
    case '0':
      return 'Connection timeout or network unreachable';
    case '1':
      return 'Invalid HTTP response';
    case '2':
      return 'Invalid domain or DNS resolution failed';
    case '3':
      return 'Page redirects too many times';
    case '4':
      return 'Bad request (400)';
    case '401':
      return 'Unauthorized access (401)';
    case '403':
      return 'Access forbidden (403)';
    case '404':
      return 'Keyword not found (404)';
    case '408':
      return 'Connection timeout (408)';
    case '500':
      return 'Internal server error (500)';
    case '502':
      return 'Bad gateway (502)';
    case '503':
      return 'Service unavailable (503)';
    case '504':
      return 'Gateway timeout (504)';
    default:
      // Try to extract meaningful information from detail
      if (detail.includes('timeout') || detail.includes('timed out')) {
        return 'Request timed out';
      }
      if (detail.includes('connection') || detail.includes('connect')) {
        return 'Connection failed';
      }
      if (detail.includes('ssl') || detail.includes('certificate')) {
        return 'SSL/TLS certificate issue';
      }
      if (detail.includes('dns')) {
        return 'DNS resolution failed';
      }

      // If we have a detail but no specific match, use it
      if (detail && detail.trim()) {
        return detail.length > 100 ? `${detail.substring(0, 100)}...` : detail;
      }

      // Fallback to generic message with code
      return `HTTP ${code} error`;
  }
};

const generateIncidents = (monitors: Monitor[]) => {
  const incidents: any[] = [];

  for (const monitor of monitors) {
    if (!monitor.logs || monitor.logs.length === 0) continue;

    let currentIncident = null;

    const sortedLogs = [...monitor.logs].sort((a, b) => a.datetime - b.datetime);

    sortedLogs.forEach((log) => {
      if (log.type === 1) {
        // Check if incident is ongoing based on duration and current monitor status
        const hasNoDuration = !log.duration || log.duration === 0;
        const isMonitorCurrentlyDown = monitor.status === 0 || monitor.status === 1; // 0 = paused, 1 = not checked yet, 2 = up, 8 = seems down, 9 = down
        const isOngoing = hasNoDuration && isMonitorCurrentlyDown;

        currentIncident = {
          id: `incident-${monitor.id}-${log.datetime}`,
          monitorId: monitor.id,
          monitorName: monitor.friendly_name,
          startTime: new Date(log.datetime * 1000),
          endTime: log.duration ? new Date((log.datetime + log.duration) * 1000) : undefined,
          logs: [log],
          status: isOngoing ? 'ongoing' : 'resolved',
          duration: Math.round(log.duration / 60) || 0,
          reason: log.reason, // Store the reason information
        };
        incidents.push(currentIncident);
      }
    });
  }

  return incidents.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};

export default function IncidentHistory({ monitors }: IncidentHistoryProps) {
  const incidents = generateIncidents(monitors);

  if (incidents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Incident History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Activity className="mb-4 h-12 w-12 text-green-500" />
            <h3 className="mb-2 text-xl font-semibold">No incidents recorded</h3>
            <p className="text-muted-foreground">All systems have been operating normally.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {incidents.map((incident) => (
            <div key={incident.id} className="border-b pb-6 last:border-0">
              <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between">
                <h3 className="text-lg font-semibold">{incident.monitorName} Outage</h3>
                <Badge
                  variant={
                    incident.status === 'resolved'
                      ? 'outline'
                      : incident.status === 'ongoing'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {incident.status === 'resolved'
                    ? 'Resolved'
                    : incident.status === 'ongoing'
                      ? 'Ongoing'
                      : 'Under Investigation'}
                </Badge>
              </div>

              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {incident.startTime
                    ? format(incident.startTime, 'MMMM d, yyyy HH:mm')
                    : 'Unknown start'}
                </span>
                <span>·</span>
                <span>
                  Duration:{' '}
                  {incident.status === 'ongoing'
                    ? 'Ongoing'
                    : typeof incident.duration === 'number' &&
                        !isNaN(incident.duration) &&
                        incident.duration > 0
                      ? formatDuration(incident.duration)
                      : 'Unknown'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/20">
                  <p className="mb-1 text-sm font-medium text-orange-700 dark:text-orange-300">
                    {format(incident.startTime, 'HH:mm')} - Service disruption detected
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    <strong>Issue:</strong> {formatIncidentReason(incident.reason)}
                    {incident.reason?.code && (
                      <span className="ml-2 rounded bg-orange-100 px-2 py-1 text-xs dark:bg-orange-900">
                        Code: {incident.reason.code}
                      </span>
                    )}
                  </p>
                  <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                    Our monitoring system detected that {incident.monitorName} was experiencing
                    issues. The team was{' '}
                    {incident.status === 'ongoing' ? 'immediately' : 'automatically'} notified and{' '}
                    {incident.status === 'ongoing' ? 'is investigating' : 'began investigation'}.
                  </p>
                </div>

                {incident.status === 'resolved' && incident.endTime && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
                    <p className="mb-1 text-sm font-medium text-green-700 dark:text-green-300">
                      {format(incident.endTime, 'HH:mm')} - Service restored
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      The issue has been resolved and {incident.monitorName} is back to normal
                      operation.
                      {incident.duration > 0 && (
                        <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs dark:bg-green-900">
                          Downtime: {formatDuration(incident.duration)}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {incident.status === 'resolved' && !incident.endTime && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
                    <p className="mb-1 text-sm font-medium text-green-700 dark:text-green-300">
                      Resolution time unknown - Service restored
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      The issue was resolved and {incident.monitorName} returned to normal
                      operation, though the exact resolution time is unavailable.
                      {incident.duration > 0 && (
                        <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs dark:bg-green-900">
                          Estimated downtime: {formatDuration(incident.duration)}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {incident.status === 'ongoing' && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                    <p className="mb-1 text-sm font-medium text-red-700 dark:text-red-300">
                      Ongoing - Active investigation
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <strong>Current issue:</strong> {formatIncidentReason(incident.reason)}
                      {incident.reason?.code && (
                        <span className="ml-2 rounded bg-red-100 px-2 py-1 text-xs dark:bg-red-900">
                          Code: {incident.reason.code}
                        </span>
                      )}
                    </p>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Our engineering team is actively working to resolve this issue with{' '}
                      {incident.monitorName}. We will provide updates as they become available.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
