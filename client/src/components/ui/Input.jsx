import { forwardRef } from 'react';
import clsx from 'clsx';

export const Label = ({ children, htmlFor, className }) => (
  <label htmlFor={htmlFor} className={clsx('block text-label text-graphite uppercase mb-1.5', className)}>
    {children}
  </label>
);

export const FieldError = ({ children }) =>
  children ? <p className="mt-1.5 text-small text-fail">{children}</p> : null;

export const FieldHint = ({ children }) =>
  children ? <p className="mt-1.5 text-small text-pencil">{children}</p> : null;

const Input = forwardRef(function Input({ className, error, mono, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full h-10 rounded-card border bg-paper px-3 text-body text-ink placeholder:text-pencil transition-colors duration-micro',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-marker focus-visible:ring-offset-2',
        error ? 'border-fail' : 'border-rule focus:border-graphite',
        mono && 'font-mono tabular-nums',
        className,
      )}
      {...props}
    />
  );
});

export default Input;
