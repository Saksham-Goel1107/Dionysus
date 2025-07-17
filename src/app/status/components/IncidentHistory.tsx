'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Clock, Activity } from 'lucide-react';

interface IncidentHistoryProps {
  monitors: Monitor[];
}

// Process real monitor logs to create incident history
const generateIncidents = (monitors: Monitor[]) => {
  const incidents: any[] = [];

  // Process each monitor's logs
  for (const monitor of monitors) {
    // Skip if no logs
    if (!monitor.logs || monitor.logs.length === 0) continue;

    let currentIncident = null;

    // Sort logs by datetime ascending
    const sortedLogs = [...monitor.logs].sort((a, b) => a.datetime - b.datetime);

    // Process logs to create incidents
    sortedLogs.forEach((log, index) => {
      // Down event (start of incident)
      if (log.type === 1) {
        currentIncident = {
          id: `incident-${monitor.id}-${log.datetime}`,
          monitorId: monitor.id,
          monitorName: monitor.friendly_name,
          startTime: new Date(log.datetime * 1000),
          endTime: log.duration ? new Date((log.datetime + log.duration) * 1000) : undefined,
          logs: [log],
          status: 'resolved',
          duration: Math.round(log.duration / 60) || 0, // Convert seconds to minutes
        };
        incidents.push(currentIncident);
      }
    });
  }

  // Sort incidents by date, most recent first
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
            <Activity className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No incidents recorded</h3>
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
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h3 className="text-lg font-semibold">{incident.monitorName} Outage</h3>
                <Badge variant={incident.status === 'resolved' ? 'outline' : 'secondary'}>
                  {incident.status === 'resolved' ? 'Resolved' : 'Investigating'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
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
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm font-medium mb-1">
                    {format(incident.startTime, 'HH:mm')} - System detected issues
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Our monitoring system detected that {incident.monitorName} was not responding
                    properly. The team was automatically notified and began investigation.
                  </p>
                </div>

                {incident.status === 'resolved' && incident.endTime && (
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">
                      {format(incident.endTime, 'HH:mm')} - Issue resolved
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The issue was identified and resolved. The system returned to normal
                      operation.
                    </p>
                  </div>
                )}
                {incident.status === 'resolved' && !incident.endTime && (
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Resolution time unknown</p>
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
