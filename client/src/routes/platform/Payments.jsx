import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import Badge from '../../components/console/Badge';
import { Table, Thead, Tr, Th, Td } from '../../components/console/Table';
import { SkeletonRows } from '../../components/console/Skeleton';
import { pageEnter } from '../../lib/motion';

const STATUS_VARIANT = { pending: 'neutral', success: 'pass', failed: 'fail' };

export default function Payments() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['platform-payments'],
    queryFn: () => api.get('/api/platform/payments').then((r) => r.data.payments),
  });

  return (
    <motion.div {...pageEnter}>
      <h1 className="text-3xl md:text-4xl font-black text-white mb-8">Payments</h1>

      {isLoading && <SkeletonRows rows={4} />}

      {payments?.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Organization</Th>
              <Th>Reference</Th>
              <Th>Status</Th>
              <Th numeric>Credits</Th>
              <Th numeric>Amount</Th>
              <Th>Date</Th>
            </tr>
          </Thead>
          <tbody>
            {payments.map((p) => (
              <Tr key={p._id}>
                <Td className="text-white">{p.organization?.name}</Td>
                <Td mono>{p.paystackReference}</Td>
                <Td><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></Td>
                <Td numeric mono>{p.creditsPurchased}</Td>
                <Td numeric mono>{(p.amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</Td>
                <Td mono>{new Date(p.createdAt).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </motion.div>
  );
}
