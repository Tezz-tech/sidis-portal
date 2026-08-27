import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Card({ className, children, padded = true, animate = true, delay = 0, ...props }) {
  const Component = animate ? motion.div : 'div';
  const motionProps = animate
    ? { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4, delay } }
    : {};

  return (
    <Component
      className={clsx(
        'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl',
        padded && 'p-6',
        className,
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={clsx('text-lg font-bold text-white mb-1', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-4', className)} {...props}>
      {children}
    </div>
  );
}
