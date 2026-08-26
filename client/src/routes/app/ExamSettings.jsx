import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Card, { CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Label, FieldHint } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { pageEnter } from '../../lib/motion';

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-body text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors duration-micro relative ${checked ? 'bg-ink' : 'bg-rule'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-paper transition-transform duration-micro ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

export default function ExamSettings() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: exam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => api.get(`/api/exams/${examId}`).then((r) => r.data.exam),
  });

  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (exam) setConfig(exam.config);
  }, [exam]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.patch(`/api/exams/${examId}/config`, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exam', examId] }); toast.success('Settings saved'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!config) return null;

  const isLocked = exam.status === 'published' || exam.status === 'closed';

  return (
    <motion.div {...pageEnter} className="max-w-2xl">
      <h1 className="font-display text-page-title text-ink mb-2">Exam settings</h1>
      <p className="text-body text-graphite mb-8">{exam.title}</p>

      <Card className="space-y-6 mb-6">
        <CardTitle>Timing</CardTitle>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input id="duration" type="number" mono min={1} value={config.durationMinutes} disabled={isLocked}
              onChange={(e) => setConfig((c) => ({ ...c, durationMinutes: Number(e.target.value) }))} />
          </div>
          <div>
            <Label htmlFor="passMark">Pass mark (%)</Label>
            <Input id="passMark" type="number" mono min={0} max={100} value={config.passMark} disabled={isLocked}
              onChange={(e) => setConfig((c) => ({ ...c, passMark: Number(e.target.value) }))} />
          </div>
          <div>
            <Label htmlFor="opensAt">Opens at (optional)</Label>
            <Input id="opensAt" type="datetime-local" disabled={isLocked}
              value={config.opensAt ? toLocalInput(config.opensAt) : ''}
              onChange={(e) => setConfig((c) => ({ ...c, opensAt: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
          </div>
          <div>
            <Label htmlFor="closesAt">Closes at (optional)</Label>
            <Input id="closesAt" type="datetime-local" disabled={isLocked}
              value={config.closesAt ? toLocalInput(config.closesAt) : ''}
              onChange={(e) => setConfig((c) => ({ ...c, closesAt: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
            <FieldHint>Invitations expire when the exam closes, if set.</FieldHint>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <CardTitle>Behaviour</CardTitle>
        <div className="divide-y divide-rule">
          <Toggle label="Shuffle question order per attempt" checked={config.shuffleQuestions} onChange={(v) => setConfig((c) => ({ ...c, shuffleQuestions: v }))} />
          <Toggle label="Shuffle option order per attempt" checked={config.shuffleOptions} onChange={(v) => setConfig((c) => ({ ...c, shuffleOptions: v }))} />
          <Toggle label="Allow retakes" checked={config.allowRetakes} onChange={(v) => setConfig((c) => ({ ...c, allowRetakes: v }))} />
        </div>
        {config.allowRetakes && (
          <div className="mt-4 w-40">
            <Label htmlFor="maxAttempts">Max attempts</Label>
            <Input id="maxAttempts" type="number" mono min={1} value={config.maxAttempts} onChange={(e) => setConfig((c) => ({ ...c, maxAttempts: Number(e.target.value) }))} />
          </div>
        )}
      </Card>

      <Card className="mb-6 space-y-4">
        <CardTitle>Results</CardTitle>
        {isLocked && (
          <p className="text-small text-graphite">
            This exam is already live — everything else is locked, but you can still change when results are shown.
          </p>
        )}
        <div>
          <Label htmlFor="resultVisibility">When can participants see results?</Label>
          <Select id="resultVisibility" value={config.resultVisibility} onChange={(e) => setConfig((c) => ({ ...c, resultVisibility: e.target.value }))}>
            <option value="immediate">Immediately after submitting</option>
            <option value="after_close">After the exam closes</option>
            <option value="never">Never shown to participants</option>
          </Select>
        </div>
        <Toggle label="Show correct answers in results" checked={config.showCorrectAnswers} onChange={(v) => setConfig((c) => ({ ...c, showCorrectAnswers: v }))} />
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => saveMutation.mutate(config)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : 'Save settings'}
        </Button>
        {exam.status === 'review' && exam.reviewConfirmedAt && (
          <Button variant="marker" onClick={() => navigate(`/app/exams/${examId}/invitations`)}>
            Continue to invite participants
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
