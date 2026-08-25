import { forwardRef } from 'react';
import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-ink text-paper hover:bg-graphite disabled:bg-pencil',
  marker: 'bg-marker text-paper hover:bg-marker-deep disabled:bg-pencil',
  secondary: 'bg-paper text-ink border border-rule hover:bg-sheet disabled:text-pencil',
  ghost: 'bg-transparent text-ink hover:bg-sheet disabled:text-pencil',
  danger: 'bg-paper text-fail border border-fail/30 hover:bg-fail/5 disabled:text-pencil disabled:border-rule',
};

const SIZES = {
  sm: 'h-8 px-3 text-small',
  md: 'h-10 px-4 text-body',
  lg: 'h-11 px-5 text-body',
};

const Button = forwardRef(function Button(
  { as: Component = 'button', variant = 'primary', size = 'md', className, children, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-card font-medium transition-colors duration-micro ease-standard whitespace-nowrap disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

export default Button;
