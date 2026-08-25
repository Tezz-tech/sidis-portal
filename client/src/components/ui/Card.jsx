import clsx from 'clsx';

export default function Card({ className, children, padded = true, ...props }) {
  return (
    <div
      className={clsx('bg-paper border border-rule rounded-card', padded && 'p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={clsx('text-card-title text-ink mb-1', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Registration marks: small printed-paper crop marks. Used on exactly two
 * surfaces — the exam instructions card and the result summary card — never
 * as a general decorative device.
 */
export function RegistrationMarks({ children, className }) {
  return (
    <div className={clsx('relative', className)}>
      {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((pos, i) => (
        <span key={i} className={clsx('absolute w-3 h-3 border-rule pointer-events-none', pos)} style={{ margin: '-1px' }} />
      ))}
      {children}
    </div>
  );
}
