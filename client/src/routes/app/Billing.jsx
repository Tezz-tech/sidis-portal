import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { Table, Thead, Tr, Th, Td } from '../../components/ui/Table';
import { pageEnter } from '../../lib/motion';

const TYPE_LABEL = {
  purchase: 'Purchase',
  generation: 'Generation',
  grading: 'Grading',
  refund: 'Refund',
  grant: 'Grant',
  reservation: 'Reserved',
  release: 'Released',
};

export default function Billing() {
  const { data: balance } = useQuery({
    queryKey: ['balance'],
    queryFn: () => api.get('/api/billing/balance').then((r) => r.data.creditBalance),
  });

  const { data: packs } = useQuery({
    queryKey: ['packs'],
    queryFn: () => api.get('/api/billing/packs').then((r) => r.data.packs),
  });

  const { data: ledger, isLoading } = useQuery({
    queryKey: ['ledger'],
    queryFn: () => api.get('/api/billing/ledger').then((r) => r.data.entries),
  });

  const purchaseMutation = useMutation({
    mutationFn: (packId) => api.post('/api/billing/purchase', { packId }).then((r) => r.data),
    onSuccess: (data) => { window.location.href = data.authorizationUrl; },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <motion.div {...pageEnter}>
      <h1 className="font-display text-page-title text-ink mb-2">Billing</h1>
      <p className="text-body text-graphite mb-8">Credits cover question generation and short-answer grading.</p>

      <Card className="mb-8">
        <p className="text-label text-graphite mb-2">Current balance</p>
        <p className="font-mono text-[32px] text-ink tabular-nums">{balance != null ? balance.toLocaleString() : '—'}</p>
      </Card>

      <h2 className="text-section-head text-ink mb-4">Buy credits</h2>
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {packs?.map((pack) => (
          <Card key={pack._id}>
            <p className="text-label text-graphite mb-2">{pack.name}</p>
            <p className="font-mono text-[24px] text-ink tabular-nums mb-1">
              {(pack.priceKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}
            </p>
            <p className="text-small text-pencil font-mono mb-4">{pack.credits.toLocaleString()} credits</p>
            <Button variant="marker" className="w-full" disabled={purchaseMutation.isPending} onClick={() => purchaseMutation.mutate(pack._id)}>
              Buy
            </Button>
          </Card>
        ))}
      </div>

      <h2 className="text-section-head text-ink mb-4">Transaction history</h2>
      {isLoading && <SkeletonRows rows={4} />}
      {ledger?.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Description</Th>
              <Th numeric>Amount</Th>
              <Th numeric>Balance</Th>
            </tr>
          </Thead>
          <tbody>
            {ledger.map((entry) => (
              <Tr key={entry._id}>
                <Td mono className="text-graphite">{new Date(entry.createdAt).toLocaleDateString()}</Td>
                <Td>{TYPE_LABEL[entry.type]}</Td>
                <Td className="text-graphite">{entry.description}</Td>
                <Td numeric mono className={entry.amount < 0 ? 'text-fail' : 'text-pass'}>
                  {entry.amount > 0 ? '+' : ''}{entry.amount}
                </Td>
                <Td numeric mono>{entry.balanceAfter}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </motion.div>
  );
}
