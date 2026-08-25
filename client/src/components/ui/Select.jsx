import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const Select = forwardRef(function Select({ className, error, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={clsx(
          'w-full h-10 appearance-none rounded-card border bg-paper pl-3 pr-9 text-body text-ink transition-colors duration-micro',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-marker focus-visible:ring-offset-2',
          error ? 'border-fail' : 'border-rule focus:border-graphite',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-graphite" size={16} strokeWidth={1.5} />
    </div>
  );
});

export default Select;
