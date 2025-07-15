'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import StatusHeader from './components/StatusHeader';
import IncidentHistory from './components/IncidentHistory';
import MonitorCard from './components/MonitorCard';
import { type Monitor, type UptimeRobotResponse } from './types';
import StatusChart from './components/StatusChart';

export default function StatusPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [overallUptime, setOverallUptime] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>('current');

  const fetchMonitors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/uptime', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monitor data');
      }

      const data: UptimeRobotResponse = await response.json();

      if (data.stat === 'ok') {
        setMonitors(data.monitors ?? []);

        const monitorsArr = data.monitors ?? [];
        const totalUptime = monitorsArr.reduce(
          (acc: number, monitor) => acc + (parseFloat(monitor.all_time_uptime_ratio as any) || 0),
          0,
        );
        const average = monitorsArr.length > 0 ? totalUptime / monitorsArr.length : 0;
        setOverallUptime(parseFloat(average.toFixed(2)));

        setLastUpdated(new Date());
      } else {
        throw new Error(data.error?.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching monitors:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();

    const interval = setInterval(() => {
      fetchMonitors();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getSystemStatus = () => {
    if (loading || monitors.length === 0) return 'Checking...';

    const downMonitors = monitors.filter((monitor) => monitor.status !== 2);
    if (downMonitors.length > 0) {
      return downMonitors.length === monitors.length ? 'Major Outage' : 'Partial Outage';
    }
    return 'All Systems Operational';
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 2:
        return 'bg-green-500';
      case 9:
        return 'bg-yellow-500';
      case 8:
        return 'bg-blue-500';
      default:
        return 'bg-red-500';
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 2:
        return 'success';
      case 9:
        return 'warning';
      case 8:
        return 'warning';
      default:
        return 'destructive';
    }
  };

  const systemStatus = getSystemStatus();
  const isAllOperational = systemStatus === 'All Systems Operational';

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <StatusHeader
        status={systemStatus}
        isAllOperational={isAllOperational}
        uptime={overallUptime}
        onRefresh={fetchMonitors}
        lastUpdated={lastUpdated}
      />

      {loading ? (
        <div className="mt-8 space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="mt-8 border-red-300 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300">Error Loading Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <button
              onClick={fetchMonitors}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="current">Current Status</TabsTrigger>
              <TabsTrigger value="history">Incident History</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {monitors.map((monitor) => (
                  <MonitorCard
                    key={monitor.id}
                    monitor={monitor}
                    getStatusColor={getStatusColor}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Overall Performance (Last 24 Hours)</CardTitle>
                  <CardDescription>Uptime across all monitored services</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <StatusChart monitors={monitors} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <IncidentHistory monitors={monitors} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          Status page powered by Uptime Robot • Last refreshed{' '}
          {lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }) : 'just now'}
        </p>
      </div>
    </div>
  );
}
