import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Pencil, Trash2, RefreshCw, ChevronUp, ChevronDown, Plus, Check, Quote } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { SkeletonRows } from '../../components/ui/Skeleton';
import QuestionEditorModal from './QuestionEditorModal';
import { pageEnter } from '../../lib/motion';

const TYPE_LABEL = { mcq: 'Multiple choice', true_false: 'True / false', short_answer: 'Short answer' };
const SOURCE_LABEL = { ai: 'AI', ai_edited: 'AI, edited', manual: 'Manual' };

export default function QuestionReview() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // 'new' | question object | null
  const [regeneratingId, setRegeneratingId] = useState(null);

  const { data: exam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => api.get(`/api/exams/${examId}`).then((r) => r.data.exam),
  });

  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions', examId],
    queryFn: () => api.get(`/api/exams/${examId}/questions`).then((r) => r.data.questions),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['questions', examId] });
    queryClient.invalidateQueries({ queryKey: ['exam', examId] });
  };

  const saveMutation = useMutation({
    mutationFn: (form) => {
      if (form._id) return api.patch(`/api/exams/${examId}/questions/${form._id}`, form);
      return api.post(`/api/exams/${examId}/questions`, form);
    },
    onSuccess: () => { invalidate(); setEditing(null); toast.success('Question saved'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/exams/${examId}/questions/${id}`),
    onSuccess: () => { invalidate(); toast.success('Question removed'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const reorderMutation = useMutation({
    mutationFn: (questionIds) => api.patch(`/api/exams/${examId}/questions/reorder`, { questionIds }),
    onSuccess: () => invalidate(),
  });

  const regenerateMutation = useMutation({
    mutationFn: (id) => api.post(`/api/exams/${examId}/questions/${id}/regenerate`),
    onMutate: (id) => setRegeneratingId(id),
    onSuccess: () => { invalidate(); toast.success('Question regenerated'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
    onSettled: () => setRegeneratingId(null),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/api/exams/${examId}/confirm-review`),
    onSuccess: () => { invalidate(); toast.success('Question set confirmed'); navigate(`/app/exams/${examId}/settings`); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const move = (index, direction) => {
    if (!questions) return;
    const next = [...questions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next.map((q) => q._id));
  };

  const isLocked = exam && exam.status !== 'draft' && exam.status !== 'review';

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-page-title text-ink">{exam?.title || 'Review questions'}</h1>
          <p className="text-body text-graphite mt-1">
            {questions?.length ?? 0} questions · {exam?.totalPoints ?? 0} points
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setEditing('new')} disabled={isLocked}>
            <Plus size={16} strokeWidth={1.5} /> Add question
          </Button>
          <Button
            variant="marker"
            onClick={() => confirmMutation.mutate()}
            disabled={isLocked || exam?.status === 'published' || confirmMutation.isPending || !questions?.length}
          >
            <Check size={16} strokeWidth={1.5} />
            {exam?.reviewConfirmedAt ? 'Confirmed' : 'Confirm question set'}
          </Button>
        </div>
      </div>

      {isLoading && <SkeletonRows rows={5} />}

      <div className="space-y-4">
        {questions?.map((q, i) => (
          <div key={q._id} className="bg-paper border border-rule rounded-card p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-small text-pencil tabular-nums w-6">{String(i + 1).padStart(2, '0')}</span>
                <Badge variant="neutral">{TYPE_LABEL[q.type]}</Badge>
                <Badge variant={q.source === 'manual' ? 'neutral' : 'marker'}>{SOURCE_LABEL[q.source]}</Badge>
                <span className="text-small text-pencil font-mono">{q.points} pt{q.points === 1 ? '' : 's'}</span>
              </div>
              <div className="flex items-center gap-1">
                <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0 || isLocked}><ChevronUp size={16} strokeWidth={1.5} /></IconButton>
                <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === questions.length - 1 || isLocked}><ChevronDown size={16} strokeWidth={1.5} /></IconButton>
                {q.source !== 'manual' && (
                  <IconButton label="Regenerate" onClick={() => regenerateMutation.mutate(q._id)} disabled={isLocked || regeneratingId === q._id}>
                    <RefreshCw size={16} strokeWidth={1.5} className={regeneratingId === q._id ? 'animate-spin' : ''} />
                  </IconButton>
                )}
                <IconButton label="Edit" onClick={() => setEditing(q)} disabled={isLocked}><Pencil size={16} strokeWidth={1.5} /></IconButton>
                <IconButton label="Delete" onClick={() => deleteMutation.mutate(q._id)} disabled={isLocked} danger><Trash2 size={16} strokeWidth={1.5} /></IconButton>
              </div>
            </div>

            <p className="text-body text-ink mb-3">{q.prompt}</p>

            {(q.type === 'mcq' || q.type === 'true_false') && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {q.options.map((opt) => (
                  <div
                    key={opt.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-chip border text-small ${
                      opt.key === q.correctOptionKey ? 'border-pass/40 bg-pass/5 text-ink' : 'border-rule text-graphite'
                    }`}
                  >
                    <span className="font-mono text-pencil">{opt.key}</span>
                    {opt.text}
                  </div>
                ))}
              </div>
            )}

            {q.type === 'short_answer' && (
              <div className="mb-3 px-3 py-2 rounded-chip border border-pass/40 bg-pass/5 text-small text-ink">
                Expected: {q.expectedAnswer}
              </div>
            )}

            {q.sourceExcerpt && (
              <div className="flex gap-2 pl-3 border-l-2 border-rule text-small text-graphite italic">
                <Quote size={14} strokeWidth={1.5} className="text-pencil shrink-0 mt-0.5" />
                {q.sourceExcerpt}
              </div>
            )}
          </div>
        ))}
      </div>

      <QuestionEditorModal
        open={Boolean(editing)}
        initial={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={(form) => saveMutation.mutate(editing === 'new' ? form : { ...form, _id: editing._id })}
        saving={saveMutation.isPending}
      />
    </motion.div>
  );
}

function IconButton({ children, label, danger, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`p-2 rounded-chip transition-colors duration-micro disabled:opacity-30 disabled:cursor-not-allowed ${
        danger ? 'text-graphite hover:text-fail hover:bg-fail/5' : 'text-graphite hover:text-ink hover:bg-sheet'
      }`}
      {...props}
    >
      {children}
    </button>
  );
}
