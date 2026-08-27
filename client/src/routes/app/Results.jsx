import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import Badge from '../../components/console/Badge';
import Button from '../../components/console/Button';
import EmptyState from '../../components/console/EmptyState';
import { SkeletonRows } from '../../components/console/Skeleton';
import { Table, Thead, Tr, Th, Td } from '../../components/console/Table';
import { pageEnter } from '../../lib/motion';

export default function Results() {
  const { examId } = useParams();

  const { data: results, isLoading } = useQuery({
    queryKey: ['results', examId],
    queryFn: () => api.get(`/api/exams/${examId}/results`).then((r) => r.data.results),
  });

  const handleExport = () => {
    window.open(`${api.defaults.baseURL}/api/exams/${examId}/results/export`, '_blank');
  };

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-center justify-end mb-8">
        <Button variant="secondary" onClick={handleExport}>
          <Download size={16} strokeWidth={1.75} /> Export CSV
        </Button>
      </div>

      {isLoading && <SkeletonRows rows={4} />}

      {!isLoading && results?.length === 0 && (
        <EmptyState title="No results yet" description="Results will appear here once participants submit." />
      )}

      {results?.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Participant</Th>
              <Th>Status</Th>
              <Th numeric>Score</Th>
              <Th numeric>Percentage</Th>
              <Th>Result</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {results.map((r) => (
              <Tr key={r.attemptId}>
                <Td>
                  <p className="text-white">{r.participant.firstName} {r.participant.lastName}</p>
                  <p className="text-sm text-gray-400 font-mono">{r.participant.email}</p>
                </Td>
                <Td>
                  <Badge variant={r.status === 'graded' ? 'neutral' : r.gradingFailReason ? 'fail' : 'marker'}>
                    {r.status === 'graded' ? 'Graded' : r.gradingFailReason ? 'Grading failed' : 'Grading'}
                  </Badge>
                  {r.hasLowConfidenceFlags && (
                    <span className="inline-flex items-center gap-1 text-sm text-orange-400 ml-2">
                      <AlertTriangle size={12} strokeWidth={1.75} /> Review
                    </span>
                  )}
                </Td>
                <Td numeric mono>{r.status === 'graded' ? r.score : '—'}</Td>
                <Td numeric mono>{r.status === 'graded' ? `${r.percentage}%` : '—'}</Td>
                <Td>
                  {r.status === 'graded' && (
                    <Badge variant={r.passed ? 'pass' : 'fail'}>{r.passed ? 'Passed' : 'Failed'}</Badge>
                  )}
                </Td>
                <Td className="text-right">
                  <Link to={`/app/exams/${examId}/results/${r.attemptId}`} className="text-sm text-orange-400 hover:text-orange-300 transition-colors duration-200">
                    View
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </motion.div>
  );
}
