import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-200/80', className)}
      {...props}
    />
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="rounded-xl border border-surface-200 overflow-hidden bg-white">
        <div className="p-4 border-b border-surface-100 bg-surface-50 flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 border-b border-surface-100 flex gap-4 items-center">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
