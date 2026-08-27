import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/console/Button';
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
        <p className="text-gray-400">{apiErrorMessage(error, 'This invitation link is not valid.')}</p>
      </motion.div>
    );
  }

  // The same link is reused everywhere — the original invite email, a
  // resumed session, and the "your result is ready" email all point back
  // here. Without this, someone who already finished (or is mid-attempt)
  // saw "you have been invited to take this exam" with a plain "Continue"
  // button, which reads exactly like starting over.
  const alreadySubmitted = invite.invitationStatus === 'submitted';
  const inProgress = invite.invitationStatus === 'started';
  const introText = alreadySubmitted
    ? `Hello ${invite.participantFirstName}. You've already completed this exam — verify your identity below to view your result.`
    : inProgress
      ? `Hello ${invite.participantFirstName}. You have an exam in progress — verify your identity below to continue where you left off.`
      : `Hello ${invite.participantFirstName}. You have been invited to take this exam.`;
  const buttonLabel = alreadySubmitted ? 'View your result' : inProgress ? 'Resume exam' : 'Continue';

  return (
    <motion.div {...pageEnter} className="text-center py-8">
      {invite.organizationLogoUrl ? (
        <img src={invite.organizationLogoUrl} alt={invite.organizationName} className="h-10 mx-auto mb-6" />
      ) : (
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{invite.organizationName}</p>
      )}
      <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{invite.examTitle}</h1>
      <p className="text-gray-400 mb-8">{introText}</p>
      {!alreadySubmitted && (
        <div className="flex justify-center gap-8 text-sm text-gray-400 mb-10 font-mono">
          <span>{invite.durationMinutes} minutes</span>
          <span>{invite.questionCount} questions</span>
          <span>{invite.passMark}% to pass</span>
        </div>
      )}
      <Button variant="marker" size="lg" onClick={() => navigate(`/exam/${token}/verify`)}>
        {buttonLabel}
      </Button>
    </motion.div>
  );
}
