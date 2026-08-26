import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import BubbleRow from '../../components/ui/BubbleRow';
import { useCountdown, formatDuration } from '../../hooks/useCountdown';
import { pageEnter } from '../../lib/motion';

const AUTOSAVE_INTERVAL_MS = 10000;
const DEBOUNCE_MS = 800;

export default function Runner() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [savedAt, setSavedAt] = useState(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const pendingSaves = useRef({});
  const debounceTimers = useRef({});
  const submittedRef = useRef(false);

  const { data: state, error: startError } = useQuery({
    queryKey: ['attempt-start'],
    queryFn: () => api.post('/api/exam/attempt/start').then((r) => r.data),
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!state) return;
    const initialAnswers = {};
    const initialFlagged = {};
    state.answers.forEach((a) => {
      initialAnswers[a.questionId] = { selectedOptionKey: a.selectedOptionKey, textAnswer: a.textAnswer };
      initialFlagged[a.questionId] = a.flaggedForReview;
    });
    setAnswers(initialAnswers);
    setFlagged(initialFlagged);
  }, [state]);

  const secondsLeft = useCountdown(state?.serverDeadlineAt);

  const submitMutation = useMutation({
    mutationFn: () => api.post('/api/exam/attempt/submit'),
    onSuccess: () => navigate(`/exam/${token}/submitted`),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  useEffect(() => {
    if (secondsLeft === 0 && state && !submittedRef.current) {
      submittedRef.current = true;
      submitMutation.mutate();
    }
  }, [secondsLeft, state]); // eslint-disable-line react-hooks/exhaustive-deps

  const flushSave = useCallback(async (questionId) => {
    const payload = pendingSaves.current[questionId];
    if (!payload) return;
    delete pendingSaves.current[questionId];
    try {
      await api.patch(`/api/exam/attempt/answers/${questionId}`, payload);
      setSavedAt(new Date());
    } catch (err) {
      // Autosave failures are silent by design — the periodic full sweep and
      // the next debounced attempt will retry without interrupting the exam.
    }
  }, []);

  const scheduleSave = useCallback((questionId, payload) => {
    pendingSaves.current[questionId] = { ...pendingSaves.current[questionId], ...payload };
    clearTimeout(debounceTimers.current[questionId]);
    debounceTimers.current[questionId] = setTimeout(() => flushSave(questionId), DEBOUNCE_MS);
  }, [flushSave]);

  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(pendingSaves.current).forEach((qid) => flushSave(qid));
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [flushSave]);

  // Integrity: log tab switches, window blurs, and fullscreen exits without
  // blocking or accusing — the creator sees these on the result view and
  // judges for themselves.
  useEffect(() => {
    const postEvent = (event) => api.post('/api/exam/attempt/integrity', { event }).catch(() => {});
    const onVisibility = () => { if (document.hidden) postEvent('tab_switch'); };
    const onBlur = () => postEvent('window_blur');
    const onFullscreenChange = () => { if (!document.fullscreenElement) postEvent('fullscreen_exit'); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const questions = state?.questions || [];
  const current = questions[currentIndex];

  const answeredCount = useMemo(
    () => questions.filter((q) => {
      const a = answers[q.id];
      return a && (a.selectedOptionKey || a.textAnswer);
    }).length,
    [questions, answers],
  );

  // A failed /attempt/start (exam not open yet, already closed, already
  // attempted, deadline passed...) used to leave this page completely
  // blank — the only trace was a 400 in the browser's network tab, with no
  // on-screen explanation at all.
  if (startError) {
    return (
      <motion.div {...pageEnter} className="text-center py-16">
        <h1 className="font-display text-page-title text-ink mb-2">Can&rsquo;t start this exam</h1>
        <p className="text-body text-graphite mb-8">{apiErrorMessage(startError, 'Something went wrong starting this exam.')}</p>
        <Button variant="secondary" onClick={() => navigate(`/exam/${token}/instructions`)}>Back to instructions</Button>
      </motion.div>
    );
  }

  if (!state || !current || secondsLeft === null) return null;

  const setAnswer = (patch) => {
    setAnswers((prev) => ({ ...prev, [current.id]: { ...prev[current.id], ...patch } }));
    scheduleSave(current.id, patch);
  };

  const toggleFlag = () => {
    const next = !flagged[current.id];
    setFlagged((prev) => ({ ...prev, [current.id]: next }));
    scheduleSave(current.id, { flaggedForReview: next });
  };

  const bubbleItems = questions.map((q, i) => ({
    id: q.id,
    number: i + 1,
    filled: Boolean(answers[q.id]?.selectedOptionKey || answers[q.id]?.textAnswer),
    flagged: flagged[q.id],
    current: i === currentIndex,
  }));

  const unansweredCount = questions.length - answeredCount;
  const isLowTime = secondsLeft <= 60;

  return (
    <div className="pb-32 md:pb-8">
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-sheet/95 backdrop-blur border-b border-rule flex items-center justify-between mb-6">
        <p className="text-body text-ink font-medium truncate">{state.examTitle}</p>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-small text-pencil font-mono hidden sm:inline">Saved</span>}
          <span className={clsx('font-mono text-timer tabular-nums', isLowTime ? 'text-marker timer-pulse' : 'text-ink')}>
            {formatDuration(secondsLeft)}
          </span>
        </div>
      </div>

      <div className="md:grid md:grid-cols-[1fr_220px] md:gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-label text-pencil font-mono">QUESTION {currentIndex + 1} OF {questions.length}</p>
            <button
              type="button"
              onClick={toggleFlag}
              className={clsx(
                'inline-flex items-center gap-1.5 text-small px-2.5 py-1 rounded-chip border transition-colors duration-micro',
                flagged[current.id] ? 'border-marker text-marker-deep bg-marker-wash' : 'border-rule text-graphite hover:bg-sheet',
              )}
            >
              <Flag size={14} strokeWidth={1.5} /> {flagged[current.id] ? 'Flagged' : 'Flag for review'}
            </button>
          </div>

          <p className="text-body text-ink mb-6 text-[17px] leading-relaxed">{current.prompt}</p>

          {(current.type === 'mcq' || current.type === 'true_false') && (
            <div className="space-y-2 mb-8">
              {current.options.map((opt) => (
                <label
                  key={opt.key}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-card border cursor-pointer transition-colors duration-micro',
                    answers[current.id]?.selectedOptionKey === opt.key ? 'border-ink bg-sheet' : 'border-rule hover:bg-sheet',
                  )}
                >
                  <input
                    type="radio"
                    name={current.id}
                    checked={answers[current.id]?.selectedOptionKey === opt.key}
                    onChange={() => setAnswer({ selectedOptionKey: opt.key })}
                    className="accent-marker w-4 h-4"
                  />
                  <span className="font-mono text-small text-pencil">{opt.key}</span>
                  <span className="text-body text-ink">{opt.text}</span>
                </label>
              ))}
            </div>
          )}

          {current.type === 'short_answer' && (
            <textarea
              value={answers[current.id]?.textAnswer || ''}
              onChange={(e) => setAnswer({ textAnswer: e.target.value })}
              rows={6}
              className="w-full rounded-card border border-rule bg-paper px-4 py-3 text-body text-ink mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-marker focus-visible:ring-offset-2"
              placeholder="Write your answer here"
            />
          )}

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
              <ChevronLeft size={16} strokeWidth={1.5} /> Previous
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
                Next <ChevronRight size={16} strokeWidth={1.5} />
              </Button>
            ) : (
              <Button variant="marker" onClick={() => setConfirmSubmitOpen(true)}>Submit exam</Button>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <p className="text-label text-graphite mb-3">Questions</p>
          <BubbleRow items={bubbleItems} size="sm" onSelect={(item, i) => setCurrentIndex(i)} />
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 bg-paper border-t border-rule px-4 py-3 overflow-x-auto">
        <BubbleRow items={bubbleItems} size="sm" wrap={false} onSelect={(item, i) => setCurrentIndex(i)} />
      </div>

      <Modal
        open={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        title="Submit exam"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmSubmitOpen(false)}>Keep working</Button>
            <Button variant="marker" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit exam'}
            </Button>
          </>
        }
      >
        <p className="text-body text-graphite">
          {unansweredCount > 0
            ? `You have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}. Once submitted, you cannot change your answers.`
            : 'All questions are answered. Once submitted, you cannot change your answers.'}
        </p>
      </Modal>
    </div>
  );
}
