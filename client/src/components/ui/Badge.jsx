import clsx from 'clsx';

const VARIANTS = {
  neutral: 'bg-sheet text-graphite border-rule',
  ink: 'bg-ink text-paper border-ink',
  marker: 'bg-marker-wash text-marker-deep border-marker/30',
  pass: 'bg-pass/10 text-pass border-pass/30',
  fail: 'bg-fail/10 text-fail border-fail/30',
};

export default function Badge({ variant = 'neutral', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-chip border px-2 py-0.5 text-small font-medium',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
