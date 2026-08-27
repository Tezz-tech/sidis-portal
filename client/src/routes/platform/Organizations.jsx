import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/console/Button';
import Badge from '../../components/console/Badge';
import Input, { Label, FieldError } from '../../components/console/Input';
import Select from '../../components/console/Select';
import Modal from '../../components/console/Modal';
import { Table, Thead, Tr, Th, Td } from '../../components/console/Table';
import { SkeletonRows } from '../../components/console/Skeleton';
import { pageEnter } from '../../lib/motion';

export default function Organizations() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', type: 'company', adminEmail: '', adminFirstName: '', adminLastName: '' });
  const [error, setError] = useState('');

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['platform-organizations'],
    queryFn: () => api.get('/api/platform/organizations').then((r) => r.data.organizations),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/api/platform/organizations', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-organizations'] });
      setOpen(false);
      toast.success('Workspace created');
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white">Organizations</h1>
        <Button variant="marker" onClick={() => setOpen(true)}>
          <Plus size={16} strokeWidth={1.75} /> New workspace
        </Button>
      </div>

      {isLoading && <SkeletonRows rows={4} />}

      {organizations?.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Organization</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th numeric>Credits</Th>
              <Th numeric>Exams</Th>
              <Th numeric>Attempts</Th>
            </tr>
          </Thead>
          <tbody>
            {organizations.map((org) => (
              <Tr key={org._id}>
                <Td><Link to={`/admin/organizations/${org._id}`} className="text-white hover:text-orange-400 transition-colors duration-200">{org.name}</Link></Td>
                <Td className="capitalize">{org.type}</Td>
                <Td><Badge variant={org.status === 'active' ? 'pass' : 'fail'}>{org.status}</Badge></Td>
                <Td numeric mono>{org.creditBalance.toLocaleString()}</Td>
                <Td numeric mono>{org.examCount}</Td>
                <Td numeric mono>{org.attemptCount}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New workspace"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="marker" disabled={createMutation.isPending} onClick={() => { setError(''); createMutation.mutate(form); }}>
              {createMutation.isPending ? 'Creating...' : 'Create workspace'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="o-name">Organization name</Label>
            <Input id="o-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="o-slug">Workspace URL slug</Label>
            <Input id="o-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))} placeholder="e.g. acme-co" />
          </div>
          <div>
            <Label htmlFor="o-type">Type</Label>
            <Select id="o-type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="company" className="bg-gray-900">Company</option>
              <option value="school" className="bg-gray-900">School</option>
              <option value="other" className="bg-gray-900">Other</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="a-first">Admin first name</Label>
              <Input id="a-first" value={form.adminFirstName} onChange={(e) => setForm((f) => ({ ...f, adminFirstName: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="a-last">Admin last name</Label>
              <Input id="a-last" value={form.adminLastName} onChange={(e) => setForm((f) => ({ ...f, adminLastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="a-email">Admin email</Label>
            <Input id="a-email" type="email" value={form.adminEmail} onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))} />
          </div>
          <FieldError>{error}</FieldError>
        </div>
      </Modal>
    </motion.div>
  );
}
