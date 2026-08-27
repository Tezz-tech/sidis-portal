import clsx from 'clsx';

const VARIANTS = {
  neutral: 'bg-white/10 text-gray-300 border-white/20',
  ink: 'bg-white/15 text-white border-white/25',
  marker: 'bg-orange-400/10 text-orange-300 border-orange-400/30',
  pass: 'bg-green-400/10 text-green-300 border-green-400/30',
  fail: 'bg-red-400/10 text-red-300 border-red-400/30',
};

export default function Badge({ variant = 'neutral', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
