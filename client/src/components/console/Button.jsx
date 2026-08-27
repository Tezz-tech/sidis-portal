import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const MotionLink = motion(Link);

const VARIANTS = {
  primary: 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white shadow-lg shadow-orange-500/30 disabled:opacity-40',
  marker: 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white shadow-lg shadow-orange-500/30 disabled:opacity-40',
  secondary: 'bg-white/10 border border-white/20 text-gray-200 hover:bg-white/20 disabled:opacity-40',
  ghost: 'bg-transparent text-gray-300 hover:bg-white/10 disabled:opacity-40',
  danger: 'bg-transparent text-red-400 border border-red-400/30 hover:bg-red-400/10 disabled:opacity-40',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm rounded-xl',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-2xl',
};

const Button = forwardRef(function Button(
  { as, to, variant = 'primary', size = 'md', className, children, disabled, ...props },
  ref,
) {
  const classes = clsx(
    'inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap transition-all duration-300 disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (to && !disabled) {
    return (
      <MotionLink ref={ref} to={to} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={classes} {...props}>
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      ref={ref}
      type={props.type || 'button'}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export default Button;
