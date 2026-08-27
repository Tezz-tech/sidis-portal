import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/console/Button';
import Badge from '../../components/console/Badge';
import Input, { Label, FieldError } from '../../components/console/Input';
import Select from '../../components/console/Select';
import Modal from '../../components/console/Modal';
import { Table, Thead, Tr, Th, Td } from '../../components/console/Table';
import { pageEnter } from '../../lib/motion';

export default function Team() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'creator' });
  const [formError, setFormError] = useState('');

  const { data: team, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.get('/api/team').then((r) => r.data.team),
  });

  const inviteMutation = useMutation({
    mutationFn: (payload) => api.post('/api/team', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setInviteOpen(false);
      setForm({ email: '', firstName: '', lastName: '', role: 'creator' });
      toast.success('Invite sent');
    },
    onError: (err) => setFormError(apiErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/api/team/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
  });

  const resendMutation = useMutation({
    mutationFn: (id) => api.post(`/api/team/${id}/resend-invite`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team'] }); toast.success('Invite resent'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white">Team</h1>
        {user?.role === 'org_admin' && (
          <Button variant="marker" onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} strokeWidth={1.75} /> Invite team member
          </Button>
        )}
      </div>

      {!isLoading && team?.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {team.map((member) => (
              <Tr key={member.id}>
                <Td className="text-white">{member.firstName} {member.lastName}</Td>
                <Td mono>{member.email}</Td>
                <Td className="capitalize">{member.role.replace('_', ' ')}</Td>
                <Td><Badge variant={member.status === 'active' ? 'pass' : 'neutral'}>{member.status}</Badge></Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-4">
                    {user?.role === 'org_admin' && member.status === 'invited' && (
                      <button
                        type="button"
                        className="text-sm text-orange-400 hover:text-orange-300 transition-colors duration-200"
                        onClick={() => resendMutation.mutate(member.id)}
                        disabled={resendMutation.isPending}
                      >
                        Resend invite
                      </button>
                    )}
                    {user?.role === 'org_admin' && member.id !== user.id && member.status !== 'invited' && (
                      <button
                        type="button"
                        className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        onClick={() => statusMutation.mutate({ id: member.id, status: member.status === 'active' ? 'disabled' : 'active' })}
                      >
                        {member.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite team member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="marker" disabled={inviteMutation.isPending} onClick={() => { setFormError(''); inviteMutation.mutate(form); }}>
              {inviteMutation.isPending ? 'Sending...' : 'Send invite'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="t-first">First name</Label>
              <Input id="t-first" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="t-last">Last name</Label>
              <Input id="t-last" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="t-email">Email</Label>
            <Input id="t-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="t-role">Role</Label>
            <Select id="t-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="creator" className="bg-gray-900">Creator — can build and manage exams</option>
              <option value="org_admin" className="bg-gray-900">Admin — full access, including billing and team</option>
            </Select>
          </div>
          <FieldError>{formError}</FieldError>
        </div>
      </Modal>
    </motion.div>
  );
}
