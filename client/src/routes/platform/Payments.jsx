import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Badge from '../../components/console/Badge';
import Button from '../../components/console/Button';
import Modal from '../../components/console/Modal';
import { Table, Thead, Tr, Th, Td } from '../../components/console/Table';
import { SkeletonRows } from '../../components/console/Skeleton';
import { pageEnter } from '../../lib/motion';

const STATUS_VARIANT = { pending: 'neutral', success: 'pass', failed: 'fail' };

export default function Payments() {
  const queryClient = useQueryClient();
  const [refundTarget, setRefundTarget] = useState(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['platform-payments'],
    queryFn: () => api.get('/api/platform/payments').then((r) => r.data.payments),
  });

  const refundMutation = useMutation({
    mutationFn: (paymentId) => api.post(`/api/platform/payments/${paymentId}/refund`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-payments'] });
      toast.success('Credits refunded');
      setRefundTarget(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
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
              <Th></Th>
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
                <Td className="text-right">
                  {p.refundedAt ? (
                    <span className="text-sm text-gray-500">Refunded</span>
                  ) : p.status === 'success' ? (
                    <Button variant="secondary" size="sm" onClick={() => setRefundTarget(p)}>Refund</Button>
                  ) : null}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title="Refund credits"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefundTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={refundMutation.isPending}
              onClick={() => refundMutation.mutate(refundTarget._id)}
            >
              {refundMutation.isPending ? 'Refunding...' : 'Refund credits'}
            </Button>
          </>
        }
      >
        <p className="text-gray-400">
          This claws back <strong className="text-white">{refundTarget?.creditsPurchased} credits</strong> from{' '}
          <strong className="text-white">{refundTarget?.organization?.name}</strong>&rsquo;s balance. It only reverses
          the credits on Sidis&rsquo;s ledger — it does not refund the actual charge through Paystack, which has to be
          done separately if the customer is being given their money back.
        </p>
      </Modal>
    </motion.div>
  );
}
