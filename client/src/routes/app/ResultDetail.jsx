import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AlertTriangle, Check, X, Pencil } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input, { Label, FieldError } from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { pageEnter } from '../../lib/motion';

export default function ResultDetail() {
  const { examId, attemptId } = useParams();
  const queryClient = useQueryClient();
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [overridePoints, setOverridePoints] = useState(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState('');

  const { data: result, isLoading } = useQuery({
    queryKey: ['result', examId, attemptId],
    queryFn: () => api.get(`/api/exams/${examId}/results/${attemptId}`).then((r) => r.data.result),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ questionId, pointsAwarded, reason }) =>
      api.post(`/api/exams/${examId}/results/${attemptId}/override`, { questionId, pointsAwarded, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['result', examId, attemptId] });
      toast.success('Score updated');
      setOverrideTarget(null);
    },
    onError: (err) => setOverrideError(apiErrorMessage(err)),
  });

  const openOverride = (answer) => {
    setOverrideTarget(answer);
    setOverridePoints(answer.pointsAwarded);
    setOverrideReason('');
    setOverrideError('');
  };

  if (isLoading || !result) return null;

  const integrityCount = (result.integrity?.tabSwitches || 0) + (result.integrity?.windowBlurs || 0) + (result.integrity?.fullscreenExits || 0);

  return (
    <motion.div {...pageEnter} className="max-w-3xl">
      <h1 className="font-display text-page-title text-ink mb-1">
        {result.participant.firstName} {result.participant.lastName}
      </h1>
      <p className="text-body text-graphite mb-8 font-mono">{result.participant.email}</p>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-label text-graphite mb-2">Score</p>
          <p className="font-mono text-[24px] text-ink tabular-nums">{result.score}</p>
        </Card>
        <Card>
          <p className="text-label text-graphite mb-2">Percentage</p>
          <p className="font-mono text-[24px] text-ink tabular-nums">{result.percentage}%</p>
        </Card>
        <Card>
          <p className="text-label text-graphite mb-2">Result</p>
          {result.status === 'graded' ? (
            <Badge variant={result.passed ? 'pass' : 'fail'}>{result.passed ? 'Passed' : 'Failed'}</Badge>
          ) : (
            <Badge variant="marker">Grading</Badge>
          )}
        </Card>
      </div>

      {integrityCount > 0 && (
        <Card className="mb-8 border-marker/30 bg-marker-wash">
          <div className="flex items-center gap-2 text-marker-deep">
            <AlertTriangle size={16} strokeWidth={1.5} />
            <p className="text-body">
              {result.integrity.tabSwitches} tab switch{result.integrity.tabSwitches === 1 ? '' : 'es'},{' '}
              {result.integrity.windowBlurs} window blur{result.integrity.windowBlurs === 1 ? '' : 's'},{' '}
              {result.integrity.fullscreenExits} fullscreen exit{result.integrity.fullscreenExits === 1 ? '' : 's'} recorded during this attempt.
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {result.answers.map((a, i) => (
          <div key={a.questionId} className="bg-paper border border-rule rounded-card p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-small text-pencil tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {a.isCorrect ? (
                  <Check size={16} strokeWidth={2} className="text-pass" />
                ) : (
                  <X size={16} strokeWidth={2} className="text-fail" />
                )}
                <span className="font-mono text-small text-graphite">{a.pointsAwarded} / {a.maxPoints} pts</span>
                {a.flaggedForReview && (
                  <span className="inline-flex items-center gap-1 text-small text-marker-deep">
                    <AlertTriangle size={12} strokeWidth={1.5} /> Low confidence ({Math.round((a.aiConfidence || 0) * 100)}%)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => openOverride(a)}
                className="text-small text-graphite hover:text-ink inline-flex items-center gap-1"
              >
                <Pencil size={14} strokeWidth={1.5} /> Override
              </button>
            </div>
            <p className="text-body text-ink mb-2">{a.prompt}</p>
            <p className="text-small text-graphite mb-1">
              Response: <span className="text-ink">{a.selectedOptionKey || a.textAnswer || '(no answer)'}</span>
            </p>
            {a.type === 'short_answer' && a.aiReasoning && (
              <p className="text-small text-pencil italic mt-2">AI reasoning: {a.aiReasoning}</p>
            )}
            {a.overriddenBy && <p className="text-small text-marker-deep mt-2">Overridden: {a.overrideReason}</p>}
          </div>
        ))}
      </div>

      <Modal
        open={Boolean(overrideTarget)}
        onClose={() => setOverrideTarget(null)}
        title="Override score"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOverrideTarget(null)}>Cancel</Button>
            <Button
              variant="marker"
              disabled={overrideMutation.isPending}
              onClick={() => {
                if (!overrideReason.trim()) { setOverrideError('Explain why you are overriding this score'); return; }
                overrideMutation.mutate({ questionId: overrideTarget.questionId, pointsAwarded: overridePoints, reason: overrideReason });
              }}
            >
              {overrideMutation.isPending ? 'Saving...' : 'Save override'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="w-32">
            <Label htmlFor="override-points">Points awarded</Label>
            <Input id="override-points" type="number" mono min={0} max={overrideTarget?.maxPoints} value={overridePoints} onChange={(e) => setOverridePoints(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="override-reason">Reason (required)</Label>
            <Textarea id="override-reason" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
          </div>
          <FieldError>{overrideError}</FieldError>
        </div>
      </Modal>
    </motion.div>
  );
}
