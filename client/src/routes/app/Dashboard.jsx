import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import Card, { CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { pageEnter } from '../../lib/motion';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard').then((r) => r.data),
  });

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-page-title text-ink">Dashboard</h1>
          <p className="text-body text-graphite mt-1">{data?.organizationName}</p>
        </div>
        <Button as={Link} to="/app/documents" variant="marker">
          <Upload size={16} strokeWidth={1.5} /> New exam
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-label text-graphite mb-2">Credit balance</p>
          <p className="font-mono text-[28px] text-ink tabular-nums">{isLoading ? '—' : data.creditBalance.toLocaleString()}</p>
          <Link to="/app/billing" className="text-small text-marker-deep hover:underline mt-2 inline-block">Buy more credits</Link>
        </Card>
        <Card>
          <p className="text-label text-graphite mb-2">Needing review</p>
          <p className="font-mono text-[28px] text-ink tabular-nums">{isLoading ? '—' : data.examsNeedingReview.length}</p>
          <p className="text-small text-pencil mt-2">Exams with generated questions waiting for confirmation</p>
        </Card>
        <Card>
          <p className="text-label text-graphite mb-2">Recent submissions</p>
          <p className="font-mono text-[28px] text-ink tabular-nums">{isLoading ? '—' : data.recentAttempts.length}</p>
          <p className="text-small text-pencil mt-2">In the last set of activity</p>
        </Card>
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
                  className="flex items-center justify-between py-3 border-b border-rule last:border-0 hover:bg-sheet -mx-2 px-2 rounded-card transition-colors duration-micro"
                >
                  <div>
                    <p className="text-body text-ink">{exam.title}</p>
                    <p className="text-small text-pencil font-mono">{exam.questionCount} questions</p>
                  </div>
                  <ArrowRight size={16} strokeWidth={1.5} className="text-graphite" />
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
                <div key={attempt._id} className="flex items-center justify-between py-3 border-b border-rule last:border-0">
                  <div>
                    <p className="text-body text-ink">{attempt.participant?.firstName} {attempt.participant?.lastName}</p>
                    <p className="text-small text-pencil">{attempt.exam?.title}</p>
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
