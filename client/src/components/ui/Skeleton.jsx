import clsx from 'clsx';

export default function Skeleton({ className }) {
  return <div className={clsx('skeleton', className)} />;
}

export function SkeletonRows({ rows = 3, className }) {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="border border-rule rounded-card p-6 bg-paper space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
