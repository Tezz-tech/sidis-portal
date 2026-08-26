import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const MotionLink = motion(Link);

const VARIANTS = {
  primary: 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white shadow-2xl shadow-orange-500/40',
  secondary: 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20',
};

const SIZES = {
  lg: 'text-xl px-10 py-5 gap-4',
  md: 'text-base px-6 py-3.5 gap-3',
  sm: 'text-sm px-4 py-2.5 gap-2',
};

export default function MarketingButton({ to, type = 'button', variant = 'primary', size = 'lg', className, children, ...props }) {
  const Component = to ? MotionLink : motion.button;
  const componentProps = to ? { to } : { type };

  return (
    <Component
      {...componentProps}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-300',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
