import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { Table, Thead, Tr, Th, Td } from '../../components/console/Table';
import { SkeletonRows } from '../../components/console/Skeleton';
import EmptyState from '../../components/console/EmptyState';
import { pageEnter } from '../../lib/motion';

export default function AuditLog() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['platform-audit-log'],
    queryFn: () => api.get('/api/platform/audit-log').then((r) => r.data.entries),
  });

  return (
    <motion.div {...pageEnter}>
      <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Audit log</h1>
      <p className="text-gray-400 mb-8">Every sensitive action taken across the platform, most recent first.</p>

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
                <Td mono className="whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</Td>
                <Td className="font-mono text-sm text-white">{entry.action}</Td>
                <Td>{entry.organization?.name || '—'}</Td>
                <Td>{entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : 'System'}</Td>
                <Td className="text-sm">{entry.targetModel ? `${entry.targetModel} · ${entry.targetId}` : '—'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </motion.div>
  );
}
