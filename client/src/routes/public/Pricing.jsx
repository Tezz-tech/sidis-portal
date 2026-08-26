import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import { SkeletonCard } from '../../components/ui/Skeleton';
import MarketingButton from './marketing/MarketingButton';
import GradientBlobs from './marketing/GradientBlobs';

const EASE = [0.16, 1, 0.3, 1];

export default function Pricing() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-pricing'],
    queryFn: () => api.get('/api/public/pricing').then((r) => r.data.packs),
  });

  const featured = data ? Math.floor(data.length / 2) : -1;

  return (
    <div className="bg-white">
      <section className="relative bg-void pt-20 pb-28 overflow-hidden">
        <GradientBlobs />
        <div className="relative max-w-admin mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12px] font-inter font-semibold tracking-widest text-lime uppercase mb-4"
          >
            Simple pricing
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-grotesk text-[40px] sm:text-[52px] font-bold text-white mb-5 tracking-tight leading-[1.05]"
          >
            Credits, not seats.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[17px] font-inter text-white/60 max-w-md mx-auto"
          >
            Buy credits once, use them for generating and grading exams. No subscriptions, no per-seat fees.
          </motion.p>
        </div>
      </section>

      <section className="max-w-admin mx-auto px-6 -mt-16 pb-24 relative z-10">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          {data?.map((pack, i) => {
            const isFeatured = i === featured;
            return (
              <motion.div
                key={pack._id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: EASE }}
                whileHover={{ y: -6 }}
                className={`relative rounded-3xl p-7 flex flex-col transition-shadow duration-300 ${
                  isFeatured
                    ? 'bg-void text-white shadow-[0_30px_70px_-20px_rgba(124,92,252,0.45)] border border-violet/40'
                    : 'bg-white border border-violet/10 shadow-[0_20px_50px_-20px_rgba(8,8,13,0.15)] hover:shadow-[0_25px_60px_-15px_rgba(124,92,252,0.2)]'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-lime text-void text-[11px] font-inter font-bold tracking-wide">
                    MOST POPULAR
                  </span>
                )}
                <p className={`text-[13px] font-inter font-semibold tracking-wide uppercase mb-3 ${isFeatured ? 'text-lime' : 'text-violet'}`}>
                  {pack.name}
                </p>
                <p className={`font-grotesk text-[34px] font-bold mb-1 tabular-nums ${isFeatured ? 'text-white' : 'text-void'}`}>
                  {(pack.priceKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}
                </p>
                <p className={`text-[14px] font-mono mb-7 ${isFeatured ? 'text-white/50' : 'text-void/45'}`}>
                  {pack.credits.toLocaleString()} credits
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {['Question generation', 'Short-answer grading', 'Credits never expire'].map((line) => (
                    <li key={line} className={`flex items-center gap-2.5 text-[14px] font-inter ${isFeatured ? 'text-white/75' : 'text-void/65'}`}>
                      <Check size={15} strokeWidth={2.5} className={isFeatured ? 'text-lime' : 'text-violet'} />
                      {line}
                    </li>
                  ))}
                </ul>
                <MarketingButton as={Link} to="/request-workspace" variant={isFeatured ? 'primary' : 'dark'} className="w-full">
                  Get started <ArrowRight size={16} strokeWidth={2} />
                </MarketingButton>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
