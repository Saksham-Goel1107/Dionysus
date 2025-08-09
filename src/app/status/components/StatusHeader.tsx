'use client';

import { RefreshCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StatusHeaderProps {
  status: string;
  isAllOperational: boolean;
  uptime: number;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function StatusHeader({
  status,
  isAllOperational,
  uptime,
  lastUpdated,
  onRefresh,
}: StatusHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 md:flex-row md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
        <div className="mt-2 flex gap-2 md:mt-0">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
          <Button asChild variant="outline" size="sm">
            <a
              href="mailto:sakshamgoel1107@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report an Issue or Downtime
            </a>
          </Button>
        </div>
      </div>

      <Card
        className={`border-2 ${
          status === 'No Monitors Configured'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : isAllOperational
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
        }`}
      >
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            {status === 'No Monitors Configured' ? (
              <RefreshCcw className="mr-3 h-8 w-8 text-blue-500" />
            ) : isAllOperational ? (
              <CheckCircle className="mr-3 h-8 w-8 text-green-500" />
            ) : (
              <AlertTriangle className="mr-3 h-8 w-8 text-yellow-500" />
            )}
            <div>
              <h2 className="text-2xl font-bold">{status}</h2>
              <p className="text-muted-foreground">
                {lastUpdated
                  ? `Last checked ${format(lastUpdated, 'MMMM d, yyyy HH:mm:ss')}`
                  : 'Checking status...'}
              </p>
            </div>
          </div>

          <div className="w-full md:w-36">
            <p className="mb-1 text-sm font-medium">Overall Uptime</p>
            <div className="flex items-center gap-2">
              {uptime > 0 ? (
                <>
                  <Progress value={uptime} className="h-2" />
                  <span className="text-sm font-semibold">{uptime}%</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No Data Available</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
