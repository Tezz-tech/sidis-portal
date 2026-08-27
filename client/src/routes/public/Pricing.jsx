import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import { SkeletonCard } from '../../components/ui/Skeleton';
import MarketingButton from './marketing/MarketingButton';
import GlassCard from './marketing/GlassCard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const TIER_GRADIENTS = ['from-orange-400 to-pink-600', 'from-pink-400 to-purple-600', 'from-purple-400 to-orange-500'];

export default function Pricing() {
  useDocumentTitle('Pricing — Sidis');

  const { data, isLoading } = useQuery({
    queryKey: ['public-pricing'],
    queryFn: () => api.get('/api/public/pricing').then((r) => r.data.packs),
  });

  const featured = data ? Math.floor(data.length / 2) : -1;

  return (
    <div className="bg-gradient-to-b from-gray-950 to-black min-h-screen">
      <section className="pt-20 pb-16 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-orange-400 font-bold tracking-widest text-sm uppercase mb-4"
          >
            Simple pricing
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight"
          >
            Credits,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">not seats</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300 max-w-md mx-auto"
          >
            Buy credits once, use them for generating and grading exams. No subscriptions, no per-seat fees.
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          {data?.map((pack, i) => {
            const isFeatured = i === featured;
            return (
              <GlassCard
                key={pack._id}
                delay={i * 0.1}
                hover={!isFeatured}
                className={`relative p-8 flex flex-col ${isFeatured ? 'border-orange-500/50 ring-2 ring-orange-500/30 scale-105' : ''}`}
              >
                {isFeatured && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xs font-bold tracking-wide shadow-xl shadow-orange-500/40">
                    MOST POPULAR
                  </span>
                )}
                <p className={`text-2xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r ${TIER_GRADIENTS[i % TIER_GRADIENTS.length]}`}>
                  {pack.name}
                </p>
                <p className="text-4xl font-black text-white mb-1 tabular-nums">
                  {(pack.priceKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-400 mb-8">{pack.credits.toLocaleString()} credits</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {['Question generation', 'Short-answer grading', 'Credits never expire'].map((line) => (
                    <li key={line} className="flex items-center gap-3 text-gray-300">
                      <Check size={16} strokeWidth={2.5} className="text-green-400 shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
                <MarketingButton to="/request-workspace" size="md" className="w-full">
                  Get started <ArrowRight className="w-5 h-5" />
                </MarketingButton>
              </GlassCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
