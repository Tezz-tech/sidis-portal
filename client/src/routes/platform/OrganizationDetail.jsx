import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Card, { CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input, { Label, FieldError } from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import { Table, Thead, Tr, Th, Td } from '../../components/ui/Table';
import { pageEnter } from '../../lib/motion';

export default function OrganizationDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [grantOpen, setGrantOpen] = useState(false);
  const [amount, setAmount] = useState(100);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const { data: org } = useQuery({
    queryKey: ['platform-org', id],
    queryFn: () => api.get(`/api/platform/organizations/${id}`).then((r) => r.data.organization),
  });

  const { data: ledger } = useQuery({
    queryKey: ['platform-org-ledger', id],
    queryFn: () => api.get(`/api/platform/organizations/${id}/ledger`).then((r) => r.data.entries),
  });

  const grantMutation = useMutation({
    mutationFn: () => api.post(`/api/platform/organizations/${id}/credits/grant`, { amount, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-org', id] });
      queryClient.invalidateQueries({ queryKey: ['platform-org-ledger', id] });
      setGrantOpen(false);
      toast.success('Credits granted');
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const suspendMutation = useMutation({
    mutationFn: (status) => api.patch(`/api/platform/organizations/${id}/status`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-org', id] }); toast.success('Status updated'); },
  });

  if (!org) return null;

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-page-title text-ink">{org.name}</h1>
          <p className="text-body text-graphite mt-1 capitalize">{org.type} · <Badge variant={org.status === 'active' ? 'pass' : 'fail'}>{org.status}</Badge></p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => suspendMutation.mutate(org.status === 'active' ? 'suspended' : 'active')}>
            {org.status === 'active' ? 'Suspend' : 'Reactivate'}
          </Button>
          <Button variant="marker" onClick={() => setGrantOpen(true)}>Grant credits</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-label text-graphite mb-2">Credit balance</p>
          <p className="font-mono text-[24px] text-ink tabular-nums">{org.creditBalance.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-label text-graphite mb-2">Exams</p>
          <p className="font-mono text-[24px] text-ink tabular-nums">{org.examCount}</p>
        </Card>
        <Card>
          <p className="text-label text-graphite mb-2">Attempts</p>
          <p className="font-mono text-[24px] text-ink tabular-nums">{org.attemptCount}</p>
        </Card>
      </div>

      <CardTitle>Credit ledger</CardTitle>
      {ledger?.length > 0 && (
        <Table className="mt-4">
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
                <Td className="capitalize">{entry.type}</Td>
                <Td className="text-graphite">{entry.description}</Td>
                <Td numeric mono className={entry.amount < 0 ? 'text-fail' : 'text-pass'}>{entry.amount > 0 ? '+' : ''}{entry.amount}</Td>
                <Td numeric mono>{entry.balanceAfter}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        title="Grant credits"
        footer={
          <>
            <Button variant="secondary" onClick={() => setGrantOpen(false)}>Cancel</Button>
            <Button variant="marker" disabled={grantMutation.isPending} onClick={() => { setError(''); grantMutation.mutate(); }}>
              {grantMutation.isPending ? 'Granting...' : 'Grant credits'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="w-40">
            <Label htmlFor="grant-amount">Amount</Label>
            <Input id="grant-amount" type="number" mono min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="grant-description">Reason</Label>
            <Textarea id="grant-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Onboarding credit for pilot program" />
          </div>
          <FieldError>{error}</FieldError>
        </div>
      </Modal>
    </motion.div>
  );
}
