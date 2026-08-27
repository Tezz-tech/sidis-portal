import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Card, { CardTitle } from '../../components/console/Card';
import Button from '../../components/console/Button';
import Badge from '../../components/console/Badge';
import Input, { Label, FieldError } from '../../components/console/Input';
import Textarea from '../../components/console/Textarea';
import Select from '../../components/console/Select';
import Modal from '../../components/console/Modal';
import { Table, Thead, Tr, Th, Td } from '../../components/console/Table';
import { pageEnter } from '../../lib/motion';

const EXAM_STATUS_VARIANT = { draft: 'neutral', generating: 'marker', review: 'marker', published: 'ink', closed: 'neutral' };

export default function OrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [eraseOpen, setEraseOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [eraseError, setEraseError] = useState('');

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

  const eraseMutation = useMutation({
    mutationFn: () => api.post(`/api/platform/organizations/${id}/erase`, { confirmName }),
    onSuccess: () => { toast.success('Organization and all of its data have been deleted'); navigate('/admin'); },
    onError: (err) => setEraseError(apiErrorMessage(err)),
  });

  const handleExport = () => {
    window.open(`${api.defaults.baseURL}/api/platform/organizations/${id}/export`, '_blank');
  };

  if (!org) return null;

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">{org.name}</h1>
          <p className="text-gray-400 mt-1 capitalize flex items-center gap-2">{org.type} · <Badge variant={org.status === 'active' ? 'pass' : 'fail'}>{org.status}</Badge></p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>Edit</Button>
          <Button variant="secondary" onClick={() => suspendMutation.mutate(org.status === 'active' ? 'suspended' : 'active')}>
            {org.status === 'active' ? 'Suspend' : 'Reactivate'}
          </Button>
          <Button variant="secondary" onClick={() => setAdjustOpen(true)}>Adjust balance</Button>
          <Button variant="marker" onClick={() => setGrantOpen(true)}>Grant credits</Button>
          <Button variant="secondary" onClick={handleExport}>Export data</Button>
          <Button variant="danger" onClick={() => setEraseOpen(true)}>Delete organization</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card animate={false}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Credit balance</p>
          <p className="font-mono text-2xl text-white tabular-nums">{org.creditBalance.toLocaleString()}</p>
        </Card>
        <Card animate={false}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Exams</p>
          <p className="font-mono text-2xl text-white tabular-nums">{org.examCount}</p>
        </Card>
        <Card animate={false}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Attempts</p>
          <p className="font-mono text-2xl text-white tabular-nums">{org.attemptCount}</p>
        </Card>
      </div>

      <Card className="mb-8" animate={false}>
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
                  <Td className="text-white">{member.firstName} {member.lastName}</Td>
                  <Td>{member.email}</Td>
                  <Td>
                    <div className="w-36">
                      <Select
                        value={member.role}
                        onChange={(e) => roleMutation.mutate({ userId: member.id, role: e.target.value })}
                      >
                        <option value="org_admin" className="bg-gray-900">Org admin</option>
                        <option value="creator" className="bg-gray-900">Creator</option>
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

      <Card className="mb-8" animate={false}>
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
                  <Td className="text-white">{exam.title}</Td>
                  <Td><Badge variant={EXAM_STATUS_VARIANT[exam.status] || 'neutral'}>{exam.status}</Badge></Td>
                  <Td numeric mono>{exam.questionCount}</Td>
                  <Td mono>{new Date(exam.createdAt).toLocaleDateString()}</Td>
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
                <Td mono>{new Date(entry.createdAt).toLocaleDateString()}</Td>
                <Td className="capitalize text-white">{entry.type}</Td>
                <Td>{entry.description}</Td>
                <Td numeric mono className={entry.amount < 0 ? 'text-red-400' : 'text-green-400'}>{entry.amount > 0 ? '+' : ''}{entry.amount}</Td>
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
              <option value="company" className="bg-gray-900">Company</option>
              <option value="school" className="bg-gray-900">School</option>
              <option value="other" className="bg-gray-900">Other</option>
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

      <Modal
        open={eraseOpen}
        onClose={() => { setEraseOpen(false); setConfirmName(''); setEraseError(''); }}
        title="Delete organization"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEraseOpen(false); setConfirmName(''); setEraseError(''); }}>Cancel</Button>
            <Button
              variant="danger"
              disabled={eraseMutation.isPending || confirmName !== org.name}
              onClick={() => { setEraseError(''); eraseMutation.mutate(); }}
            >
              {eraseMutation.isPending ? 'Deleting...' : 'Permanently delete'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-400">
            This permanently deletes <strong className="text-white">{org.name}</strong> and everything
            attached to it — staff accounts, participants, documents, exams, questions, invitations,
            attempts, and billing history. This cannot be undone.
          </p>
          <div>
            <Label htmlFor="confirm-name">Type <span className="text-white">{org.name}</span> to confirm</Label>
            <Input id="confirm-name" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
          </div>
          <FieldError>{eraseError}</FieldError>
        </div>
      </Modal>
    </motion.div>
  );
}
