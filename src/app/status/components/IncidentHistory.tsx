'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor } from '../types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity } from 'lucide-react';

interface IncidentHistoryProps {
  monitors: Monitor[];
}

const generateIncidents = (monitors: Monitor[]) => {
  const incidents: any[] = [];

  for (const monitor of monitors) {
    if (!monitor.logs || monitor.logs.length === 0) continue;

    let currentIncident = null;

    const sortedLogs = [...monitor.logs].sort((a, b) => a.datetime - b.datetime);

    sortedLogs.forEach((log, index) => {
      if (log.type === 1) {
        currentIncident = {
          id: `incident-${monitor.id}-${log.datetime}`,
          monitorId: monitor.id,
          monitorName: monitor.friendly_name,
          startTime: new Date(log.datetime * 1000),
          endTime: log.duration ? new Date((log.datetime + log.duration) * 1000) : undefined,
          logs: [log],
          status: 'resolved',
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
                <Badge variant={incident.status === 'resolved' ? 'outline' : 'secondary'}>
                  {incident.status === 'resolved' ? 'Resolved' : 'Investigating'}
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
                  {typeof incident.duration === 'number' && !isNaN(incident.duration)
                    ? incident.duration
                    : '?'}{' '}
                  minutes
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="mb-1 text-sm font-medium">
                    {format(incident.startTime, 'HH:mm')} - System detected issues
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Our monitoring system detected that {incident.monitorName} was not responding
                    properly. The team was automatically notified and began investigation.
                  </p>
                </div>

                {incident.status === 'resolved' && incident.endTime && (
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="mb-1 text-sm font-medium">
                      {format(incident.endTime, 'HH:mm')} - Issue resolved
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The issue was identified and resolved. The system returned to normal
                      operation.
                    </p>
                  </div>
                )}
                {incident.status === 'resolved' && !incident.endTime && (
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="mb-1 text-sm font-medium">Resolution time unknown</p>
                    <p className="text-sm text-muted-foreground">
                      The issue was resolved, but the exact resolution time is unavailable.
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
