import { forwardRef } from 'react';
import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-lime text-void hover:shadow-[0_0_40px_rgba(211,255,92,0.45)] hover:-translate-y-0.5',
  ghost: 'bg-white/5 text-white border border-white/15 hover:bg-white/10 hover:border-white/30',
  dark: 'bg-void text-white hover:shadow-[0_0_30px_rgba(124,92,252,0.35)] hover:-translate-y-0.5',
};

const SIZES = {
  md: 'h-11 px-6 text-[15px]',
  lg: 'h-14 px-8 text-[16px]',
};

// A distinct button treatment for the marketing pages only — the shared
// components/ui/Button.jsx stays untouched since it's used across the whole
// app (staff dashboard, exam-taking flow), which this redesign pass
// deliberately doesn't touch yet.
const MarketingButton = forwardRef(function MarketingButton(
  { as: Component = 'button', variant = 'primary', size = 'md', className, children, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-inter font-semibold whitespace-nowrap transition-all duration-300 ease-out',
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

export default MarketingButton;
