'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function MeetingsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 sm:px-0">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Meetings list skeleton */}
      <div className="divide-y divide-gray-200 px-4 sm:px-0">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="mt-1 h-5 w-20 sm:mt-0" />
              </div>
              <div className="flex flex-wrap gap-x-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 sm:flex-nowrap">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
