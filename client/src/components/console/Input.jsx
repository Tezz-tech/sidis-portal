import { forwardRef } from 'react';
import clsx from 'clsx';

export const Label = ({ children, htmlFor, className }) => (
  <label htmlFor={htmlFor} className={clsx('block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5', className)}>
    {children}
  </label>
);

export const FieldError = ({ children }) =>
  children ? <p className="mt-1.5 text-sm text-red-400">{children}</p> : null;

export const FieldHint = ({ children }) =>
  children ? <p className="mt-1.5 text-sm text-gray-400">{children}</p> : null;

const Input = forwardRef(function Input({ className, error, mono, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full h-10 rounded-xl border bg-white/10 backdrop-blur-xl px-3 text-sm text-white placeholder:text-gray-400 transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-orange-500/20',
        error ? 'border-red-400/60 focus:border-red-400' : 'border-white/20 focus:border-orange-500',
        mono && 'font-mono tabular-nums',
        className,
      )}
      {...props}
    />
  );
});

export default Input;
