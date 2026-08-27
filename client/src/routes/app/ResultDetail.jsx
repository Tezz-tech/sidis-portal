import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AlertTriangle, Check, X, Pencil, RefreshCw } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Card from '../../components/console/Card';
import Badge from '../../components/console/Badge';
import Button from '../../components/console/Button';
import Modal from '../../components/console/Modal';
import Input, { Label, FieldError } from '../../components/console/Input';
import Textarea from '../../components/console/Textarea';
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

  const retryGradingMutation = useMutation({
    mutationFn: () => api.post(`/api/exams/${examId}/results/${attemptId}/retry-grading`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['result', examId, attemptId] });
      toast.success('Grading retried');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
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
      <h1 className="text-3xl md:text-4xl font-black text-white mb-1">
        {result.participant.firstName} {result.participant.lastName}
      </h1>
      <p className="text-gray-400 mb-8 font-mono">{result.participant.email}</p>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card animate={false}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Score</p>
          <p className="font-mono text-2xl text-white tabular-nums">{result.score}</p>
        </Card>
        <Card animate={false}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Percentage</p>
          <p className="font-mono text-2xl text-white tabular-nums">{result.percentage}%</p>
        </Card>
        <Card animate={false}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Result</p>
          {result.status === 'graded' ? (
            <Badge variant={result.passed ? 'pass' : 'fail'}>{result.passed ? 'Passed' : 'Failed'}</Badge>
          ) : result.gradingFailReason ? (
            <Badge variant="fail">Grading failed</Badge>
          ) : (
            <Badge variant="marker">Grading</Badge>
          )}
        </Card>
      </div>

      {result.gradingFailReason && (
        <Card className="mb-8 border-red-400/30 bg-red-400/5" animate={false}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-2 text-red-300">
              <AlertTriangle size={16} strokeWidth={1.75} className="shrink-0 mt-0.5" />
              <p>Grading failed: {result.gradingFailReason}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => retryGradingMutation.mutate()}
              disabled={retryGradingMutation.isPending}
            >
              <RefreshCw size={14} strokeWidth={1.75} className={retryGradingMutation.isPending ? 'animate-spin' : ''} />
              {retryGradingMutation.isPending ? 'Retrying...' : 'Retry grading'}
            </Button>
          </div>
        </Card>
      )}

      {integrityCount > 0 && (
        <Card className="mb-8 border-orange-400/30 bg-orange-400/5" animate={false}>
          <div className="flex items-center gap-2 text-orange-300">
            <AlertTriangle size={16} strokeWidth={1.75} />
            <p>
              {result.integrity.tabSwitches} tab switch{result.integrity.tabSwitches === 1 ? '' : 'es'},{' '}
              {result.integrity.windowBlurs} window blur{result.integrity.windowBlurs === 1 ? '' : 's'},{' '}
              {result.integrity.fullscreenExits} fullscreen exit{result.integrity.fullscreenExits === 1 ? '' : 's'} recorded during this attempt.
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {result.answers.map((a, i) => (
          <div key={a.questionId} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gray-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {a.isCorrect ? (
                  <Check size={16} strokeWidth={2} className="text-green-400" />
                ) : (
                  <X size={16} strokeWidth={2} className="text-red-400" />
                )}
                <span className="font-mono text-sm text-gray-400">{a.pointsAwarded} / {a.maxPoints} pts</span>
                {a.flaggedForReview && (
                  <span className="inline-flex items-center gap-1 text-sm text-orange-400">
                    <AlertTriangle size={12} strokeWidth={1.75} /> Low confidence ({Math.round((a.aiConfidence || 0) * 100)}%)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => openOverride(a)}
                className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1 transition-colors duration-200"
              >
                <Pencil size={14} strokeWidth={1.75} /> Override
              </button>
            </div>
            <p className="text-white mb-2">{a.prompt}</p>
            <p className="text-sm text-gray-400 mb-1">
              Response: <span className="text-white">{a.selectedOptionKey || a.textAnswer || '(no answer)'}</span>
            </p>
            {a.type === 'short_answer' && a.aiReasoning && (
              <p className="text-sm text-gray-400 italic mt-2">AI reasoning: {a.aiReasoning}</p>
            )}
            {a.overriddenBy && <p className="text-sm text-orange-400 mt-2">Overridden: {a.overrideReason}</p>}
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
