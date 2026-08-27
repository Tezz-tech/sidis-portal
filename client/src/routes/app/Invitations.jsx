import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Send, RotateCw } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Card from '../../components/console/Card';
import Button from '../../components/console/Button';
import Badge from '../../components/console/Badge';
import EmptyState from '../../components/console/EmptyState';
import { Table, Thead, Tr, Th, Td } from '../../components/console/Table';
import { pageEnter } from '../../lib/motion';

const STATUS_VARIANT = { sent: 'neutral', opened: 'neutral', started: 'marker', submitted: 'pass', expired: 'fail' };
const STATUS_LABEL = { sent: 'Sent', opened: 'Opened', started: 'In progress', submitted: 'Submitted', expired: 'Expired' };

export default function Invitations() {
  const { examId } = useParams();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(new Set());

  const { data: exam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => api.get(`/api/exams/${examId}`).then((r) => r.data.exam),
  });

  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ['invitations', examId],
    queryFn: () => api.get(`/api/exams/${examId}/invitations`).then((r) => r.data.invitations),
    enabled: exam?.status === 'published' || exam?.status === 'closed',
  });

  const { data: participants } = useQuery({
    queryKey: ['participants-all'],
    queryFn: () => api.get('/api/participants', { params: { limit: 500 } }).then((r) => r.data.items),
    enabled: exam && exam.status !== 'published' && exam.status !== 'closed',
  });

  const invitedIds = new Set((invitations || []).map((i) => i.participant._id));
  const notYetInvited = (participants || []).filter((p) => !invitedIds.has(p._id));

  const publishMutation = useMutation({
    mutationFn: (participantIds) => api.post(`/api/exams/${examId}/publish`, { participantIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['invitations', examId] });
      toast.success('Exam published and invitations sent');
      setSelected(new Set());
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const sendMoreMutation = useMutation({
    mutationFn: (participantIds) => api.post(`/api/exams/${examId}/invitations`, { participantIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', examId] });
      toast.success('Invitations sent');
      setSelected(new Set());
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const resendMutation = useMutation({
    mutationFn: (invitationId) => api.post(`/api/exams/${examId}/invitations/${invitationId}/resend`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invitations', examId] }); toast.success('Invitation resent'); },
  });

  const toggle = (id) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!exam) return null;

  const isPublished = exam.status === 'published' || exam.status === 'closed';

  return (
    <motion.div {...pageEnter}>
      {!isPublished && (
        <>
          {exam.status !== 'review' || !exam.reviewConfirmedAt ? (
            <Card animate={false}>
              <p className="text-gray-400">Confirm the question set before you can invite participants.</p>
            </Card>
          ) : (
            <Card padded={false} animate={false}>
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <p className="text-gray-400">{selected.size} of {participants?.length || 0} selected</p>
                <Button
                  variant="marker"
                  disabled={selected.size === 0 || publishMutation.isPending}
                  onClick={() => publishMutation.mutate(Array.from(selected))}
                >
                  <Send size={16} strokeWidth={1.75} /> Publish and invite {selected.size || ''}
                </Button>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {(participants || []).map((p) => (
                  <label key={p._id} className="flex items-center gap-3 px-6 py-3 border-b border-white/10 last:border-0 hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggle(p._id)} className="accent-orange-500 w-4 h-4" />
                    <div>
                      <p className="text-white">{p.firstName} {p.lastName}</p>
                      <p className="text-sm text-gray-500 font-mono">{p.email}</p>
                    </div>
                  </label>
                ))}
                {participants?.length === 0 && (
                  <EmptyState title="No participants to invite" description="Add participants first from the Participants page." />
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {isPublished && (
        <>
          {notYetInvited.length > 0 && (
            <div className="flex items-center justify-end mb-4">
              <Button
                variant="secondary"
                onClick={() => sendMoreMutation.mutate(notYetInvited.map((p) => p._id))}
                disabled={sendMoreMutation.isPending}
              >
                <Send size={16} strokeWidth={1.75} /> Invite {notYetInvited.length} more
              </Button>
            </div>
          )}

          {!loadingInvitations && invitations?.length === 0 && (
            <EmptyState title="No invitations sent" description="Nobody has been invited to this exam yet." />
          )}

          {invitations?.length > 0 && (
            <Table>
              <Thead>
                <tr>
                  <Th>Participant</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <tbody>
                {invitations.map((inv) => (
                  <Tr key={inv._id}>
                    <Td>
                      <p className="text-white">{inv.participant.firstName} {inv.participant.lastName}</p>
                      <p className="text-sm text-gray-500 font-mono">{inv.participant.email}</p>
                    </Td>
                    <Td><Badge variant={STATUS_VARIANT[inv.status]}>{STATUS_LABEL[inv.status]}</Badge></Td>
                    <Td className="text-right">
                      {inv.status !== 'submitted' && (
                        <button
                          type="button"
                          onClick={() => resendMutation.mutate(inv._id)}
                          className="text-sm text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 transition-colors duration-200"
                        >
                          <RotateCw size={14} strokeWidth={1.75} /> Resend
                        </button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </motion.div>
  );
}
