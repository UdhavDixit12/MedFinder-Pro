import { cn } from '../../utils/cn.js';

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/80', className)} aria-hidden="true" />;
}

export function FacilityCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card" aria-hidden="true">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4, className }) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading results">
      {Array.from({ length: count }, (_, i) => (
        <FacilityCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
