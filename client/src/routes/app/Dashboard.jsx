import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ArrowRight, Wallet, ClipboardList, Activity } from 'lucide-react';
import api from '../../lib/api';
import Card, { CardTitle } from '../../components/console/Card';
import Badge from '../../components/console/Badge';
import Button from '../../components/console/Button';
import EmptyState from '../../components/console/EmptyState';
import { SkeletonRows } from '../../components/console/Skeleton';
import { pageEnter } from '../../lib/motion';

const STATS = [
  { key: 'creditBalance', label: 'Credit balance', icon: Wallet, color: 'from-orange-500 to-pink-600', format: (v) => v.toLocaleString() },
  { key: 'examsNeedingReview', label: 'Needing review', icon: ClipboardList, color: 'from-pink-500 to-purple-600', format: (v) => v.length, hint: 'Exams with generated questions waiting for confirmation' },
  { key: 'recentAttempts', label: 'Recent submissions', icon: Activity, color: 'from-purple-500 to-orange-600', format: (v) => v.length, hint: 'In the last set of activity' },
];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard').then((r) => r.data),
  });

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">{data?.organizationName}</p>
        </div>
        <Button to="/app/documents" variant="marker">
          <Upload size={16} strokeWidth={1.75} /> New exam
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {STATS.map((stat, i) => (
          <Card key={stat.key} delay={i * 0.05}>
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
              <stat.icon size={20} strokeWidth={1.75} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-white tabular-nums">{isLoading ? '—' : stat.format(data[stat.key])}</p>
            {stat.key === 'creditBalance' ? (
              <Link to="/app/billing" className="text-sm text-orange-400 hover:text-orange-300 mt-2 inline-block transition-colors duration-200">Buy more credits</Link>
            ) : (
              stat.hint && <p className="text-sm text-gray-400 mt-2">{stat.hint}</p>
            )}
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card padded={false}>
          <div className="p-6 pb-0">
            <CardTitle>Exams needing review</CardTitle>
          </div>
          <div className="p-6">
            {isLoading && <SkeletonRows rows={3} />}
            {!isLoading && data.examsNeedingReview.length === 0 && (
              <EmptyState
                title="Nothing waiting for review"
                description="Generated questions will show up here until you confirm them."
              />
            )}
            <div className="space-y-1">
              {data?.examsNeedingReview.map((exam) => (
                <Link
                  key={exam._id}
                  to={`/app/exams/${exam._id}/review`}
                  className="flex items-center justify-between py-3 border-b border-white/10 last:border-0 hover:bg-white/5 -mx-2 px-2 rounded-xl transition-colors duration-200"
                >
                  <div>
                    <p className="text-white">{exam.title}</p>
                    <p className="text-sm text-gray-400 font-mono">{exam.questionCount} questions</p>
                  </div>
                  <ArrowRight size={16} strokeWidth={1.75} className="text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        </Card>

        <Card padded={false}>
          <div className="p-6 pb-0">
            <CardTitle>Recent submissions</CardTitle>
          </div>
          <div className="p-6">
            {isLoading && <SkeletonRows rows={3} />}
            {!isLoading && data.recentAttempts.length === 0 && (
              <EmptyState title="No submissions yet" description="Results will appear here as people complete your exams." />
            )}
            <div className="space-y-1">
              {data?.recentAttempts.map((attempt) => (
                <div key={attempt._id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                  <div>
                    <p className="text-white">{attempt.participant?.firstName} {attempt.participant?.lastName}</p>
                    <p className="text-sm text-gray-400">{attempt.exam?.title}</p>
                  </div>
                  <Badge variant={attempt.status === 'graded' ? (attempt.passed ? 'pass' : 'fail') : 'neutral'}>
                    {attempt.status === 'graded' ? (attempt.passed ? 'Passed' : 'Failed') : 'Grading'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
