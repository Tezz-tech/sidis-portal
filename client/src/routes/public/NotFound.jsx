import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { pageEnter } from '../../lib/motion';
import MarketingButton from './marketing/MarketingButton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found — Sidis');

  return (
    <motion.div {...pageEnter} className="bg-gradient-to-b from-gray-950 to-black py-24 md:py-32 text-center px-4">
      <p className="font-mono text-lg text-orange-400 mb-4">404</p>
      <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Page not found</h1>
      <p className="text-gray-400 mb-10 max-w-md mx-auto">
        The page you're looking for doesn't exist, or the link may be out of date.
      </p>
      <MarketingButton to="/">
        Back to home <ArrowRight className="w-5 h-5" />
      </MarketingButton>
    </motion.div>
  );
}
