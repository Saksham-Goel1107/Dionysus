'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor } from '../types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity } from 'lucide-react';

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
                    {format(incident.startTime, 'HH:mm')} -{' '}
                    {incident.status === 'ongoing' ? 'Issue detected' : 'System detected issues'}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Our monitoring system detected that {incident.monitorName} was not responding
                    properly. The team was{' '}
                    {incident.status === 'ongoing' ? 'immediately' : 'automatically'} notified and{' '}
                    {incident.status === 'ongoing' ? 'is investigating' : 'began investigation'}.
                  </p>
                </div>

                {incident.status === 'resolved' && incident.endTime && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
                    <p className="mb-1 text-sm font-medium text-green-700 dark:text-green-300">
                      {format(incident.endTime, 'HH:mm')} - Issue resolved
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      The issue was identified and resolved. The system returned to normal
                      operation.
                    </p>
                  </div>
                )}
                {incident.status === 'resolved' && !incident.endTime && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
                    <p className="mb-1 text-sm font-medium text-green-700 dark:text-green-300">
                      Resolution time unknown
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      The issue was resolved, but the exact resolution time is unavailable.
                    </p>
                  </div>
                )}
                {incident.status === 'ongoing' && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                    <p className="mb-1 text-sm font-medium text-red-700 dark:text-red-300">
                      Ongoing - Under investigation
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Our team is actively working to resolve this issue. We will provide updates as
                      they become available.
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
