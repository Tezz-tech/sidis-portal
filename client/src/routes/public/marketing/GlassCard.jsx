import { motion } from 'framer-motion';
import clsx from 'clsx';

// The recurring glass-panel recipe: bg-white/5, backdrop-blur, a barely-there
// white border, heavily rounded corners, scroll-triggered fade+slide-up
// entrance, and a lift+scale on hover with the border picking up the brand
// gradient's orange.
export default function GlassCard({ className, delay = 0, hover = true, children, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -8, scale: 1.02 } : undefined}
      className={clsx(
        'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-300',
        hover && 'hover:border-orange-500/40',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
