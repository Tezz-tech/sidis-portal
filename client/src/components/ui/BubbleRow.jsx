import clsx from 'clsx';

/**
 * The OMR-inspired bubble motif. Used in exactly two places in the product:
 * the exam question navigator (interactive, one bubble per question) and the
 * exam card completion indicator on the creator dashboard (non-interactive,
 * filled in proportion to submissions received). Do not reuse elsewhere.
 */
export default function BubbleRow({ items, size = 'md', onSelect, wrap = true }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

  return (
    <div className={clsx('flex gap-2', wrap ? 'flex-wrap' : 'flex-nowrap overflow-x-auto')}>
      {items.map((item, i) => (
        <button
          key={item.id ?? i}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(item, i)}
          aria-label={item.label || `Item ${i + 1}`}
          aria-current={item.current || undefined}
          data-filled={item.filled}
          data-flagged={item.flagged}
          data-current={item.current}
          className={clsx(
            'bubble text-label',
            sizes[size],
            onSelect ? 'cursor-pointer' : 'cursor-default',
            item.filled ? 'text-paper' : 'text-graphite',
          )}
        >
          {item.number ?? ''}
        </button>
      ))}
    </div>
  );
}

export function CompletionBubbles({ total, filled, size = 'sm' }) {
  const items = Array.from({ length: total }).map((_, i) => ({ filled: i < filled }));
  return <BubbleRow items={items} size={size} wrap />;
}
