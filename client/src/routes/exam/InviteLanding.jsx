import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/ui/Button';
import { pageEnter } from '../../lib/motion';

export default function InviteLanding() {
  const { token } = useParams();
  const navigate = useNavigate();

  const { data: invite, isLoading, isError, error } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => api.get(`/api/exam/invite/${token}`).then((r) => r.data),
    retry: false,
  });

  if (isLoading) return null;

  if (isError) {
    return (
      <motion.div {...pageEnter} className="text-center py-16">
        <p className="text-body text-graphite">{apiErrorMessage(error, 'This invitation link is not valid.')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageEnter} className="text-center py-8">
      {invite.organizationLogoUrl ? (
        <img src={invite.organizationLogoUrl} alt={invite.organizationName} className="h-10 mx-auto mb-6" />
      ) : (
        <p className="text-label text-graphite mb-6">{invite.organizationName}</p>
      )}
      <h1 className="font-display text-page-title text-ink mb-2">{invite.examTitle}</h1>
      <p className="text-body text-graphite mb-8">
        Hello {invite.participantFirstName}. You have been invited to take this exam.
      </p>
      <div className="flex justify-center gap-8 text-small text-graphite mb-10 font-mono">
        <span>{invite.durationMinutes} minutes</span>
        <span>{invite.questionCount} questions</span>
        <span>{invite.passMark}% to pass</span>
      </div>
      <Button variant="marker" size="lg" onClick={() => navigate(`/exam/${token}/verify`)}>
        Continue
      </Button>
    </motion.div>
  );
}
