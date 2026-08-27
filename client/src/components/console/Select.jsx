import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const Select = forwardRef(function Select({ className, error, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={clsx(
          'w-full h-10 appearance-none rounded-xl border bg-white/10 backdrop-blur-xl pl-3 pr-9 text-sm text-white transition-all duration-200',
          'focus:outline-none focus:ring-4 focus:ring-orange-500/20',
          error ? 'border-red-400/60 focus:border-red-400' : 'border-white/20 focus:border-orange-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} strokeWidth={1.75} />
    </div>
  );
});

export default Select;
