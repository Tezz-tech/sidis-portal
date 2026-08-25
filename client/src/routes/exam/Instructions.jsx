import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import { RegistrationMarks } from '../../components/ui/Card';
import { pageEnter } from '../../lib/motion';

export default function Instructions() {
  const { token } = useParams();
  const navigate = useNavigate();

  const { data: invite } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => api.get(`/api/exam/invite/${token}`).then((r) => r.data),
  });

  if (!invite) return null;

  return (
    <motion.div {...pageEnter}>
      <RegistrationMarks className="bg-paper border border-rule rounded-card p-8">
        <h1 className="font-display text-page-title text-ink mb-1">{invite.examTitle}</h1>
        <p className="text-body text-graphite mb-8">Read the instructions below before you begin.</p>

        <dl className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b border-rule">
          <div>
            <dt className="text-label text-graphite mb-1">Duration</dt>
            <dd className="font-mono text-[20px] text-ink tabular-nums">{invite.durationMinutes} min</dd>
          </div>
          <div>
            <dt className="text-label text-graphite mb-1">Questions</dt>
            <dd className="font-mono text-[20px] text-ink tabular-nums">{invite.questionCount}</dd>
          </div>
          <div>
            <dt className="text-label text-graphite mb-1">Pass mark</dt>
            <dd className="font-mono text-[20px] text-ink tabular-nums">{invite.passMark}%</dd>
          </div>
        </dl>

        <ul className="space-y-3 mb-8 text-body text-graphite list-disc list-inside">
          <li>Once you start, the timer cannot be paused. It continues even if you close this tab.</li>
          <li>Your answers are saved automatically as you go.</li>
          <li>You can flag questions to come back to before submitting.</li>
          <li>{invite.allowRetakes ? 'You may retake this exam if allowed by your organizer.' : 'You get one attempt at this exam.'}</li>
          <li>The exam submits automatically when time runs out.</li>
        </ul>

        <Button variant="marker" size="lg" className="w-full" onClick={() => navigate(`/exam/${token}/runner`)}>
          Start exam
        </Button>
      </RegistrationMarks>
    </motion.div>
  );
}
