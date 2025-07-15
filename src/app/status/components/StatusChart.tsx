'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor } from '../types';
import { format, subHours, formatDistance } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatusChartProps {
  monitors: Monitor[];
  isLoading?: boolean;
}

const formatUptime = (ratio: number): string => {
  return (ratio || 0).toFixed(2) + '%';
};

const formatResponseTime = (time: number): string => {
  if (typeof time !== 'number' || isNaN(time) || time === null || time === undefined) return 'N/A';
  if (time < 1000) return `${Math.round(time)}ms`;
  return `${(time / 1000).toFixed(2)}s`;
};

const generateDataPoints = (monitors: Monitor[]) => {
  if (!monitors || monitors.length === 0) return [];

  const now = new Date();
  const hourlyDataMap = new Map();

  for (let i = 24; i >= 0; i--) {
    const time = subHours(now, i);
    const timeFormatted = format(time, 'HH:mm');
    const fullTimeFormatted = format(time, 'yyyy-MM-dd HH:mm');

    hourlyDataMap.set(timeFormatted, {
      time: timeFormatted,
      fullTime: fullTimeFormatted,
      timestamp: time.getTime(),
    });
  }

  const hourlyData = Array.from(hourlyDataMap.values()).sort((a, b) => a.timestamp - b.timestamp);

  monitors.forEach((monitor) => {
    hourlyData.forEach((dataPoint) => {
      dataPoint[monitor.friendly_name] = 100;
      dataPoint[`${monitor.friendly_name}_data`] = {
        responseTime: null,
        monitorId: monitor.id,
        uptimeRatio: monitor.all_time_uptime_ratio,
      };
    });

    if (Array.isArray(monitor.logs) && monitor.logs.length > 0) {
      const sortedLogs = [...monitor.logs].sort((a, b) => a.datetime - b.datetime);
      let currentState = 100;
      let logIndex = 0;
      let lastResponseTime = monitor.average_response_time || null;

      for (let i = 0; i < hourlyData.length; i++) {
        const dataPoint = hourlyData[i];
        const dataPointTime = dataPoint.timestamp / 1000;

        while (
          logIndex < sortedLogs.length &&
          sortedLogs[logIndex] !== undefined &&
          typeof sortedLogs[logIndex]?.datetime !== 'undefined' &&
          sortedLogs[logIndex]!.datetime <= dataPointTime
        ) {
          const log = sortedLogs[logIndex];
          if (log && log.type === 1) {
            currentState = 0;
          } else if (log && log.type === 2) {
            currentState = 100;
            if (log.reason && log.reason.detail && log.reason.detail.includes('ms')) {
              try {
                const timeMatch = log.reason.detail.match(/(\d+)ms/);
                if (timeMatch && timeMatch[1]) {
                  lastResponseTime = parseInt(timeMatch[1]);
                }
              } catch (e) {
                lastResponseTime = monitor.average_response_time || null;
              }
            }
          } else if (log && log.type === 98) {
            currentState = 50;
          }
          logIndex++;
        }
        dataPoint[monitor.friendly_name] = currentState;
        dataPoint[`${monitor.friendly_name}_data`].responseTime = lastResponseTime;
      }
    }

    if (hourlyData.length > 0) {
      const lastPoint = hourlyData[hourlyData.length - 1];
      let statusValue = 100;

      if (monitor.status === 0) {
        statusValue = 0;
      } else if (monitor.status === 8) {
        statusValue = 0;
      } else if (monitor.status === 9) {
        statusValue = 50;
      } else if (monitor.status === 2) {
        statusValue = 100;
      }

      lastPoint[monitor.friendly_name] = statusValue;
      lastPoint[`${monitor.friendly_name}_data`].responseTime =
        monitor.average_response_time || null;
    }
  });

  monitors.forEach((monitor) => {
    if (!Array.isArray(monitor.logs) || monitor.logs.length === 0) {
      if (hourlyData.length > 0) {
        const lastPoint = hourlyData[hourlyData.length - 1];
        let statusValue = 100;

        if (monitor.status === 0) {
          statusValue = 0;
        } else if (monitor.status === 8) {
          statusValue = 0;
        } else if (monitor.status === 9) {
          statusValue = 50;
        } else if (monitor.status === 2) {
          statusValue = 100;
        }

        lastPoint[monitor.friendly_name] = statusValue;
        lastPoint[`${monitor.friendly_name}_data`].responseTime =
          monitor.average_response_time || null;
      }
    }
  });

  return hourlyData;
};
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded p-3 shadow-lg">
        <p className="font-medium">{payload[0]?.payload.fullTime}</p>
        <div className="mt-2">
          {payload.map((entry, index) => {
            const value = entry.value as number;
            const monitorData = payload[0]?.payload[`${entry.dataKey}_data`];

            return (
              <div key={index} className="flex items-center gap-2 my-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm">
                  {entry.name}: {value === 100 ? 'Up' : value === 50 ? 'Partial' : 'Down'}
                  {monitorData?.responseTime && value === 100 && (
                    <span className="ml-2 text-xs opacity-70">
                      {formatResponseTime(monitorData.responseTime)}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

import React, { useState } from 'react';

export default function StatusChart({ monitors, isLoading = false }: StatusChartProps) {
  const [showResponseTime, setShowResponseTime] = useState(false);
  const data = generateDataPoints(monitors);

  const getMonitorColor = (index: number) => {
    const colors = [
      '#3498db',
      '#2ecc71',
      '#9b59b6',
      '#f39c12',
      '#1abc9c',
      '#34495e',
      '#e67e22',
      '#16a085',
      '#8e44ad',
      '#3498db',
      '#f1c40f',
      '#27ae60',
    ];
    return colors[index % colors.length];
  };

  const hasDowntime = monitors.some(
    (monitor) => Array.isArray(monitor.logs) && monitor.logs.some((log) => log.type === 1),
  );

  const calculateOverallUptime = () => {
    if (!monitors || monitors.length === 0) return 0;

    const sum = monitors.reduce((acc, monitor) => {
      return acc + (monitor.all_time_uptime_ratio || 0);
    }, 0);

    return sum / monitors.length;
  };

  const overallUptime = calculateOverallUptime();

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!monitors || monitors.length === 0) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center border border-dashed rounded-lg">
        <div className="text-center p-6">
          <h3 className="text-lg font-medium">No monitors configured</h3>
          <p className="text-muted-foreground mt-2">Add monitors to see uptime data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-end mb-2">
        <button
          className={`px-3 py-1 rounded-l border ${!showResponseTime ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
          onClick={() => setShowResponseTime(false)}
        >
          Status
        </button>
        <button
          className={`px-3 py-1 rounded-r border-l-0 border ${showResponseTime ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
          onClick={() => setShowResponseTime(true)}
        >
          Response Time
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Uptime</p>
                <h3 className="text-2xl font-bold mt-1">{formatUptime(overallUptime)}</h3>
              </div>
              <Badge
                variant={
                  overallUptime >= 99.9
                    ? 'default'
                    : overallUptime >= 95
                      ? 'outline'
                      : 'destructive'
                }
              >
                {overallUptime >= 99.9
                  ? 'Excellent'
                  : overallUptime >= 95
                    ? 'Good'
                    : 'Needs Attention'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monitors</p>
                <h3 className="text-2xl font-bold mt-1">{monitors.length}</h3>
              </div>
              <div className="flex gap-1">
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-700 dark:text-green-400"
                >
                  {monitors.filter((m) => m.status === 2).length} Up
                </Badge>
                {monitors.some((m) => m.status !== 2) && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">
                    {monitors.filter((m) => m.status !== 2).length} Issues
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
              <h3 className="text-2xl font-bold mt-1">
                {formatResponseTime(
                  monitors.reduce((sum, m) => sum + (m.average_response_time || 0), 0) /
                    monitors.filter((m) => m.average_response_time).length || 0,
                )}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last 24h Status</p>
              <div className="flex gap-2 mt-2">
                {hasDowntime ? (
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  >
                    Incidents Detected
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-700 dark:text-green-400"
                  >
                    All Systems Operational
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{showResponseTime ? 'Response Time (24h)' : 'Uptime Status (24h)'}</CardTitle>
          <CardDescription>
            {showResponseTime
              ? 'Average response time for the past 24 hours'
              : 'Monitoring status for the past 24 hours'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {showResponseTime ? (
                <LineChart
                  data={data}
                  margin={{
                    top: 10,
                    right: 30,
                    left: -20,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="time"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    domain={[0, 'auto']}
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    tickMargin={8}
                    tickFormatter={formatResponseTime}
                  />
                  <Tooltip
                    formatter={(value) => formatResponseTime(value as number)}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend />
                  {monitors.map((monitor, index) => (
                    <Line
                      key={monitor.id}
                      type="monotone"
                      dataKey={`${monitor.friendly_name}_data.responseTime`}
                      name={monitor.friendly_name}
                      stroke={getMonitorColor(index)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              ) : (
                <LineChart
                  data={data}
                  margin={{
                    top: 10,
                    right: 30,
                    left: -20,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="time"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    tickMargin={8}
                    ticks={[0, 50, 100]}
                    tickFormatter={(value) => {
                      if (value === 0) return 'Down';
                      if (value === 50) return 'Partial';
                      return 'Up';
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => {
                      const monitor = monitors.find((m) => m.friendly_name === value);
                      return (
                        <span>
                          {value} {monitor && `(${formatUptime(monitor.all_time_uptime_ratio)})`}
                        </span>
                      );
                    }}
                  />
                  {monitors.map((monitor, index) => (
                    <Line
                      key={monitor.id}
                      type="stepAfter"
                      dataKey={monitor.friendly_name}
                      name={monitor.friendly_name}
                      strokeDasharray={undefined}
                      stroke={(() => {
                        const last = data[data.length - 1]?.[monitor.friendly_name];
                        if (last === 0) return '#e74c3c';
                        if (last === 50) return '#f39c12';
                        return getMonitorColor(index);
                      })()}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
          {!hasDowntime && data.length > 0 && !showResponseTime && (
            <div className="text-center text-xs text-muted-foreground mt-2">
              No downtime events in the last 24 hours.
            </div>
          )}
          {data.length === 0 && (
            <div className="text-center text-sm text-muted-foreground mt-2">
              No data available for the selected time period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
