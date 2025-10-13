'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Pause,
  RefreshCw,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface DeploymentStats {
  total: number;
  ready: number;
  building: number;
  error: number;
  queued: number;
  canceled: number;
  productionDeployments: number;
  previewDeployments: number;
}

interface Deployment {
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  target?: 'production' | 'staging' | 'preview' | null;
}

export default function DeploymentStats() {
  const [stats, setStats] = useState<DeploymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/vercel/deployments?limit=100');
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      const deployments: Deployment[] = data.deployments || [];

      const calculatedStats: DeploymentStats = {
        total: deployments.length,
        ready: deployments.filter((d) => d.state === 'READY').length,
        building: deployments.filter((d) => d.state === 'BUILDING' || d.state === 'INITIALIZING')
          .length,
        error: deployments.filter((d) => d.state === 'ERROR').length,
        queued: deployments.filter((d) => d.state === 'QUEUED').length,
        canceled: deployments.filter((d) => d.state === 'CANCELED').length,
        productionDeployments: deployments.filter((d) => d.target === 'production').length,
        previewDeployments: deployments.filter(
          (d) => d.target === 'preview' || d.target === 'staging',
        ).length,
      };

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Deployments',
      value: stats.total,
      icon: RefreshCw,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Ready',
      value: stats.ready,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Building',
      value: stats.building,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Errors',
      value: stats.error,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  const successRate =
    stats.total > 0 ? ((stats.ready / (stats.total - stats.canceled)) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`rounded-full p-2 ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.title === 'Total Deployments' && (
                  <p className="text-xs text-muted-foreground">
                    {stats.productionDeployments} production, {stats.previewDeployments} preview
                  </p>
                )}
                {card.title === 'Ready' && stats.total > 0 && (
                  <p className="text-xs text-muted-foreground">{successRate}% success rate</p>
                )}
                {card.title === 'Building' && stats.queued > 0 && (
                  <p className="text-xs text-muted-foreground">{stats.queued} queued</p>
                )}
                {card.title === 'Errors' && stats.total > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {((stats.error / stats.total) * 100).toFixed(1)}% failure rate
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productionDeployments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? ((stats.productionDeployments / stats.total) * 100).toFixed(1)
                : '0'}
              % of total deployments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preview & Staging</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.previewDeployments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.previewDeployments / stats.total) * 100).toFixed(1) : '0'}%
              of total deployments
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.canceled > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceled Deployments</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.canceled}</div>
            <p className="text-xs text-muted-foreground">Manually canceled or timed out</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
