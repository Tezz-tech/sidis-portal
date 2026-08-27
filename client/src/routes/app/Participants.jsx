import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Upload, Users, Trash2, Search } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/console/Button';
import Input, { Label, FieldError } from '../../components/console/Input';
import EmptyState from '../../components/console/EmptyState';
import { SkeletonRows } from '../../components/console/Skeleton';
import { Table, Thead, Tr, Th, Td } from '../../components/console/Table';
import Modal from '../../components/console/Modal';
import Pagination from '../../components/console/Pagination';
import ParticipantImportModal from './ParticipantImportModal';
import { pageEnter } from '../../lib/motion';

export default function Participants() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', externalId: '' });
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['participants', page, search],
    queryFn: () => api.get('/api/participants', { params: { page, limit: 20, search: search || undefined } }).then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['participants'] });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/api/participants', payload),
    onSuccess: () => { invalidate(); setAddOpen(false); setForm({ email: '', firstName: '', lastName: '', externalId: '' }); toast.success('Participant added'); },
    onError: (err) => setFormError(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/participants/${id}`),
    onSuccess: () => { invalidate(); toast.success('Participant removed'); },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Participants</h1>
          <p className="text-gray-400 mt-1">The people you invite to your exams.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload size={16} strokeWidth={1.75} /> Import CSV
          </Button>
          <Button variant="marker" onClick={() => setAddOpen(true)}>
            <Plus size={16} strokeWidth={1.75} /> Add participant
          </Button>
        </div>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search by name or email"
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading && <SkeletonRows rows={4} />}

      {!isLoading && data?.items.length === 0 && (
        <EmptyState
          icon={Users}
          title="No participants yet"
          description="Add people individually or import a CSV to get started."
          action={<Button variant="marker" onClick={() => setAddOpen(true)}><Plus size={16} strokeWidth={1.75} /> Add participant</Button>}
        />
      )}

      {!isLoading && data?.items.length > 0 && (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>External ID</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {data.items.map((p) => (
                <Tr key={p._id}>
                  <Td className="text-white">{p.firstName} {p.lastName}</Td>
                  <Td mono>{p.email}</Td>
                  <Td mono>{p.externalId || '—'}</Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      aria-label="Remove participant"
                      onClick={() => deleteMutation.mutate(p._id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
                    >
                      <Trash2 size={16} strokeWidth={1.75} />
                    </button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add participant"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="marker" onClick={() => { setFormError(''); createMutation.mutate(form); }} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add participant'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="p-email">Email</Label>
            <Input id="p-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="externalId">External ID (optional)</Label>
            <Input id="externalId" value={form.externalId} onChange={(e) => setForm((f) => ({ ...f, externalId: e.target.value }))} />
          </div>
          <FieldError>{formError}</FieldError>
        </div>
      </Modal>

      <ParticipantImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={invalidate} />
    </motion.div>
  );
}
