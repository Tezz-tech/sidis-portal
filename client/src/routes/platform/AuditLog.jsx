import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { Table, Thead, Tr, Th, Td } from '../../components/ui/Table';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { pageEnter } from '../../lib/motion';

export default function AuditLog() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['platform-audit-log'],
    queryFn: () => api.get('/api/platform/audit-log').then((r) => r.data.entries),
  });

  return (
    <motion.div {...pageEnter}>
      <h1 className="font-display text-page-title text-ink mb-2">Audit log</h1>
      <p className="text-body text-graphite mb-8">Every sensitive action taken across the platform, most recent first.</p>

      {isLoading && <SkeletonRows rows={6} />}

      {entries?.length === 0 && <EmptyState title="Nothing logged yet" description="Actions will show up here as they happen." />}

      {entries?.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Date</Th>
              <Th>Action</Th>
              <Th>Organization</Th>
              <Th>Actor</Th>
              <Th>Target</Th>
            </tr>
          </Thead>
          <tbody>
            {entries.map((entry) => (
              <Tr key={entry._id}>
                <Td mono className="text-graphite whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</Td>
                <Td className="font-mono text-small">{entry.action}</Td>
                <Td className="text-graphite">{entry.organization?.name || '—'}</Td>
                <Td className="text-graphite">{entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : 'System'}</Td>
                <Td className="text-graphite text-small">{entry.targetModel ? `${entry.targetModel} · ${entry.targetId}` : '—'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </motion.div>
  );
}
