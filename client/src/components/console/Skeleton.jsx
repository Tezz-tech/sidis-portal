import clsx from 'clsx';

export default function Skeleton({ className }) {
  return <div className={clsx('animate-pulse rounded-2xl bg-white/10', className)} />;
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
    <div className="border border-white/10 rounded-3xl p-6 bg-white/5 backdrop-blur-xl space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
