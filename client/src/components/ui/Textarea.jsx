import { forwardRef } from 'react';
import clsx from 'clsx';

const Textarea = forwardRef(function Textarea({ className, error, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'w-full min-h-[96px] rounded-card border bg-paper px-3 py-2 text-body text-ink placeholder:text-pencil transition-colors duration-micro',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-marker focus-visible:ring-offset-2',
        error ? 'border-fail' : 'border-rule focus:border-graphite',
        className,
      )}
      {...props}
    />
  );
});

export default Textarea;
