import { useEffect, useState } from 'react';
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
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { Table, Thead, Tr, Th, Td } from '../../components/ui/Table';
import { pageEnter } from '../../lib/motion';

const EXAM_STATUS_VARIANT = { draft: 'neutral', generating: 'marker', review: 'marker', published: 'ink', closed: 'neutral' };

export default function OrganizationDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', type: 'company', logoUrl: '' });
  const [editError, setEditError] = useState('');

  const [grantOpen, setGrantOpen] = useState(false);
  const [amount, setAmount] = useState(100);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState(-10);
  const [adjustDescription, setAdjustDescription] = useState('');
  const [adjustError, setAdjustError] = useState('');

  const invalidateOrg = () => {
    queryClient.invalidateQueries({ queryKey: ['platform-org', id] });
    queryClient.invalidateQueries({ queryKey: ['platform-org-ledger', id] });
  };

  const { data: org } = useQuery({
    queryKey: ['platform-org', id],
    queryFn: () => api.get(`/api/platform/organizations/${id}`).then((r) => r.data.organization),
  });

  const { data: ledger } = useQuery({
    queryKey: ['platform-org-ledger', id],
    queryFn: () => api.get(`/api/platform/organizations/${id}/ledger`).then((r) => r.data.entries),
  });

  const { data: team } = useQuery({
    queryKey: ['platform-org-team', id],
    queryFn: () => api.get(`/api/platform/organizations/${id}/team`).then((r) => r.data.team),
  });

  const { data: exams } = useQuery({
    queryKey: ['platform-org-exams', id],
    queryFn: () => api.get(`/api/platform/organizations/${id}/exams`).then((r) => r.data.exams),
  });

  useEffect(() => {
    if (org) setEditForm({ name: org.name, type: org.type, logoUrl: org.logoUrl || '' });
  }, [org]);

  const editMutation = useMutation({
    mutationFn: (payload) => api.patch(`/api/platform/organizations/${id}`, payload),
    onSuccess: () => { invalidateOrg(); setEditOpen(false); toast.success('Organization updated'); },
    onError: (err) => setEditError(apiErrorMessage(err)),
  });

  const grantMutation = useMutation({
    mutationFn: () => api.post(`/api/platform/organizations/${id}/credits/grant`, { amount, description }),
    onSuccess: () => { invalidateOrg(); setGrantOpen(false); toast.success('Credits granted'); },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const adjustMutation = useMutation({
    mutationFn: () => api.post(`/api/platform/organizations/${id}/credits/adjust`, { amount: adjustAmount, description: adjustDescription }),
    onSuccess: () => { invalidateOrg(); setAdjustOpen(false); toast.success('Balance adjusted'); },
    onError: (err) => setAdjustError(apiErrorMessage(err)),
  });

  const suspendMutation = useMutation({
    mutationFn: (status) => api.patch(`/api/platform/organizations/${id}/status`, { status }),
    onSuccess: () => { invalidateOrg(); toast.success('Status updated'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => api.patch(`/api/platform/organizations/${id}/team/${userId}/role`, { role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-org-team', id] }); toast.success('Role updated'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }) => api.patch(`/api/platform/organizations/${id}/team/${userId}/status`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-org-team', id] }); toast.success('Status updated'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const closeExamMutation = useMutation({
    mutationFn: (examId) => api.post(`/api/platform/organizations/${id}/exams/${examId}/close`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-org-exams', id] }); toast.success('Exam closed'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
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
          <Button variant="secondary" onClick={() => setEditOpen(true)}>Edit</Button>
          <Button variant="secondary" onClick={() => suspendMutation.mutate(org.status === 'active' ? 'suspended' : 'active')}>
            {org.status === 'active' ? 'Suspend' : 'Reactivate'}
          </Button>
          <Button variant="secondary" onClick={() => setAdjustOpen(true)}>Adjust balance</Button>
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

      <Card className="mb-8">
        <CardTitle>Team</CardTitle>
        {team?.length > 0 && (
          <Table className="mt-4">
            <Thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </Thead>
            <tbody>
              {team.map((member) => (
                <Tr key={member.id}>
                  <Td>{member.firstName} {member.lastName}</Td>
                  <Td className="text-graphite">{member.email}</Td>
                  <Td>
                    <div className="w-36">
                      <Select
                        value={member.role}
                        onChange={(e) => roleMutation.mutate({ userId: member.id, role: e.target.value })}
                      >
                        <option value="org_admin">Org admin</option>
                        <option value="creator">Creator</option>
                      </Select>
                    </div>
                  </Td>
                  <Td><Badge variant={member.status === 'active' ? 'pass' : member.status === 'invited' ? 'neutral' : 'fail'}>{member.status}</Badge></Td>
                  <Td>
                    {member.status !== 'invited' && (
                      <Button
                        variant={member.status === 'active' ? 'danger' : 'ghost'}
                        size="sm"
                        onClick={() => statusMutation.mutate({ userId: member.id, status: member.status === 'active' ? 'disabled' : 'active' })}
                      >
                        {member.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mb-8">
        <CardTitle>Exams</CardTitle>
        {exams?.length > 0 && (
          <Table className="mt-4">
            <Thead>
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th numeric>Questions</Th>
                <Th>Created</Th>
                <Th />
              </tr>
            </Thead>
            <tbody>
              {exams.map((exam) => (
                <Tr key={exam._id}>
                  <Td>{exam.title}</Td>
                  <Td><Badge variant={EXAM_STATUS_VARIANT[exam.status] || 'neutral'}>{exam.status}</Badge></Td>
                  <Td numeric mono>{exam.questionCount}</Td>
                  <Td mono className="text-graphite">{new Date(exam.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    {exam.status === 'published' && (
                      <Button variant="danger" size="sm" onClick={() => closeExamMutation.mutate(exam._id)}>
                        Force close
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

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
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit organization"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="marker" disabled={editMutation.isPending} onClick={() => { setEditError(''); editMutation.mutate(editForm); }}>
              {editMutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="e-name">Organization name</Label>
            <Input id="e-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="e-type">Type</Label>
            <Select id="e-type" value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="company">Company</option>
              <option value="school">School</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="e-logo">Logo URL (optional)</Label>
            <Input id="e-logo" value={editForm.logoUrl} onChange={(e) => setEditForm((f) => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <FieldError>{editError}</FieldError>
        </div>
      </Modal>

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

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Adjust balance"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button variant="marker" disabled={adjustMutation.isPending} onClick={() => { setAdjustError(''); adjustMutation.mutate(); }}>
              {adjustMutation.isPending ? 'Adjusting...' : 'Adjust balance'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="w-48">
            <Label htmlFor="adjust-amount">Amount (use a negative number to deduct)</Label>
            <Input id="adjust-amount" type="number" mono value={adjustAmount} onChange={(e) => setAdjustAmount(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="adjust-description">Reason</Label>
            <Textarea id="adjust-description" value={adjustDescription} onChange={(e) => setAdjustDescription(e.target.value)} placeholder="e.g. Correcting a double-charged generation run" />
          </div>
          <FieldError>{adjustError}</FieldError>
        </div>
      </Modal>
    </motion.div>
  );
}
