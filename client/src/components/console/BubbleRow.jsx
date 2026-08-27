import clsx from 'clsx';

/**
 * The OMR-inspired bubble motif for the exam question navigator — one bubble
 * per question, filled once answered, ringed when it's the current question,
 * bordered orange when flagged for review.
 */
export default function BubbleRow({ items, size = 'md', onSelect, wrap = true }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-10 h-10 text-base' };

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
          className={clsx(
            'shrink-0 inline-flex items-center justify-center rounded-full border-2 font-mono font-medium transition-colors duration-200',
            sizes[size],
            onSelect ? 'cursor-pointer' : 'cursor-default',
            item.filled
              ? 'bg-gradient-to-br from-orange-500 to-pink-600 border-transparent text-white'
              : item.flagged
                ? 'border-orange-400/60 text-orange-300 bg-orange-400/10'
                : 'border-white/15 text-gray-400 hover:border-white/30',
            item.current && 'ring-2 ring-white ring-offset-2 ring-offset-gray-950',
          )}
        >
          {item.number ?? ''}
        </button>
      ))}
    </div>
  );
}
