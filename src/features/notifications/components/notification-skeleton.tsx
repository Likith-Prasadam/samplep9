import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationSkeletonProps {
  count?: number;
}

export const NotificationListSkeleton: React.FC<NotificationSkeletonProps> =
  React.memo(({ count = 10 }) => (
    <div className="p-2 md:p-4 space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800/30 border rounded-lg border-l-4"
        >
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  ));

NotificationListSkeleton.displayName = 'NotificationListSkeleton';

export const LoadingSkeleton: React.FC = React.memo(() => (
  <div className="flex flex-col rounded-2xl h-full">
    <div className="flex flex-col h-full p-4">
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-9 w-24 md:w-32 rounded-md" />
            <Skeleton className="h-9 w-24 md:w-32 rounded-md" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800/30 border rounded-lg border-l-4"
          >
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
      <div className="flex-shrink-0 p-2 md:p-2 border-t flex justify-between items-center">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-48 rounded-md" />
      </div>
    </div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';
