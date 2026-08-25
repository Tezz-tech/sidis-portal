import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';

export default function Pricing() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-pricing'],
    queryFn: () => api.get('/api/public/pricing').then((r) => r.data.packs),
  });

  return (
    <div className="max-w-admin mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="font-display text-page-title text-ink mb-3">Credits, not seats</h1>
        <p className="text-body text-graphite max-w-md mx-auto">
          Buy credits once, use them for generating and grading exams. No subscriptions, no per-seat fees.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        {data?.map((pack) => (
          <div key={pack._id} className="border border-rule rounded-card bg-paper p-6 flex flex-col">
            <p className="text-label text-graphite mb-2">{pack.name}</p>
            <p className="font-mono text-[28px] text-ink mb-1 tabular-nums">
              {(pack.priceKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}
            </p>
            <p className="text-small text-pencil font-mono mb-6">{pack.credits.toLocaleString()} credits</p>
            <ul className="space-y-2 mb-8 flex-1">
              <li className="flex items-center gap-2 text-small text-graphite">
                <Check size={14} strokeWidth={2} className="text-pass" /> Question generation
              </li>
              <li className="flex items-center gap-2 text-small text-graphite">
                <Check size={14} strokeWidth={2} className="text-pass" /> Short-answer grading
              </li>
              <li className="flex items-center gap-2 text-small text-graphite">
                <Check size={14} strokeWidth={2} className="text-pass" /> Credits never expire
              </li>
            </ul>
            <Button as={Link} to="/request-workspace" variant="secondary">Get started</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
