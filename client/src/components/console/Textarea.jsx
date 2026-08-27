import { forwardRef } from 'react';
import clsx from 'clsx';

const Textarea = forwardRef(function Textarea({ className, error, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'w-full min-h-[96px] rounded-xl border bg-white/10 backdrop-blur-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-orange-500/20',
        error ? 'border-red-400/60 focus:border-red-400' : 'border-white/20 focus:border-orange-500',
        className,
      )}
      {...props}
    />
  );
});

export default Textarea;
