import { Skeleton } from '@/components/ui/skeleton';
import { Metadata } from 'next';
import { Suspense } from 'react';
import AIAnalyticsDashboard from './AIAnalyticsDashboard';

export const metadata: Metadata = {
  title: 'AI Analytics - Admin Dashboard | Dionysus',
  description: 'Monitor and analyze LangSmith AI metrics and performance',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default function AIAnalyticsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AIAnalyticsDashboard />
    </Suspense>
  );
}
