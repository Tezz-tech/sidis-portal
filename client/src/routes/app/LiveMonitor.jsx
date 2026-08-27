import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import Badge from '../../components/console/Badge';
import EmptyState from '../../components/console/EmptyState';
import { Table, Thead, Tr, Th, Td } from '../../components/console/Table';
import { pageEnter } from '../../lib/motion';

const STATUS_VARIANT = { not_started: 'neutral', in_progress: 'marker', submitted: 'neutral', graded: 'pass', expired: 'fail' };
const STATUS_LABEL = { not_started: 'Not started', in_progress: 'In progress', submitted: 'Submitted', graded: 'Graded', expired: 'Expired' };

function formatSeconds(s) {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function LiveMonitor() {
  const { examId } = useParams();

  const { data: rows, isLoading } = useQuery({
    queryKey: ['monitor', examId],
    queryFn: () => api.get(`/api/exams/${examId}/monitor`).then((r) => r.data.rows),
    refetchInterval: 5000,
  });

  return (
    <motion.div {...pageEnter}>
      <p className="text-gray-400 mb-8">Updates automatically while the exam is open.</p>

      {!isLoading && rows?.length === 0 && (
        <EmptyState title="No invitations yet" description="Invite participants to see activity here." />
      )}

      {rows?.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Participant</Th>
              <Th>Status</Th>
              <Th numeric>Time remaining</Th>
              <Th>Integrity</Th>
            </tr>
          </Thead>
          <tbody>
            {rows.map((row) => {
              const flags = row.integrity
                ? row.integrity.tabSwitches + row.integrity.windowBlurs + row.integrity.fullscreenExits
                : 0;
              return (
                <Tr key={row.invitationId}>
                  <Td>
                    <p className="text-white">{row.participant.firstName} {row.participant.lastName}</p>
                    <p className="text-sm text-gray-400 font-mono">{row.participant.email}</p>
                  </Td>
                  <Td><Badge variant={STATUS_VARIANT[row.attemptStatus]}>{STATUS_LABEL[row.attemptStatus]}</Badge></Td>
                  <Td numeric mono>{row.attemptStatus === 'in_progress' ? formatSeconds(row.secondsRemaining) : '—'}</Td>
                  <Td>
                    {flags > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-orange-400">
                        <AlertTriangle size={14} strokeWidth={1.75} /> {flags} event{flags === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </motion.div>
  );
}
