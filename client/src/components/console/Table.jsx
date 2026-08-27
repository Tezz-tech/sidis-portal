import clsx from 'clsx';

export function Table({ className, children }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <table className={clsx('w-full border-collapse text-sm', className)}>{children}</table>
    </div>
  );
}

export function Thead({ children }) {
  return <thead className="sticky top-0 bg-white/5 backdrop-blur-xl">{children}</thead>;
}

export function Th({ className, numeric, children }) {
  return (
    <th
      className={clsx(
        'border-b border-white/10 px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap',
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
    <tr className={clsx('transition-colors duration-200 hover:bg-white/5', className)} {...props}>
      {children}
    </tr>
  );
}

export function Td({ className, numeric, mono, children }) {
  return (
    <td
      className={clsx(
        'border-b border-white/10 px-4 py-3 text-gray-200',
        numeric && 'text-right',
        mono && 'font-mono tabular-nums text-gray-300',
        className,
      )}
    >
      {children}
    </td>
  );
}
