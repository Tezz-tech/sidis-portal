import clsx from 'clsx';

export function Table({ className, children }) {
  return (
    <div className="overflow-x-auto rounded-card border border-rule bg-paper">
      <table className={clsx('w-full border-collapse text-body', className)}>{children}</table>
    </div>
  );
}

export function Thead({ children }) {
  return <thead className="sticky top-0 bg-paper">{children}</thead>;
}

export function Th({ className, numeric, children }) {
  return (
    <th
      className={clsx(
        'border-b border-rule px-4 py-3 text-label text-graphite uppercase whitespace-nowrap',
        numeric ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Tr({ className, children, ...props }) {
  return (
    <tr className={clsx('transition-colors duration-micro hover:bg-sheet', className)} {...props}>
      {children}
    </tr>
  );
}

export function Td({ className, numeric, mono, children }) {
  return (
    <td
      className={clsx(
        'border-b border-rule px-4 py-3 text-body text-ink',
        numeric && 'text-right',
        mono && 'font-mono tabular-nums',
        className,
      )}
    >
      {children}
    </td>
  );
}
