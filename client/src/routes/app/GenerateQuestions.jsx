import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Label } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { pageEnter } from '../../lib/motion';

const STEPS = [
  { key: 'reading', label: 'Reading document' },
  { key: 'understanding', label: 'Understanding content' },
  { key: 'writing', label: 'Writing questions' },
  { key: 'checking', label: 'Checking answers' },
];

export default function GenerateQuestions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [count, setCount] = useState(20);
  const [typeMix, setTypeMix] = useState('mixed');
  const [difficulty, setDifficulty] = useState('medium');
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(null);

  const { data: exam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => api.get(`/api/exams/${examId}`).then((r) => r.data.exam),
  });

  const { data: estimate } = useQuery({
    queryKey: ['generation-estimate', examId, count],
    queryFn: () => api.get(`/api/exams/${examId}/generation/estimate`, { params: { count } }).then((r) => r.data.estimatedCost),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post(`/api/exams/${examId}/generate`, { count, typeMix, difficulty }).then((r) => r.data),
    onSuccess: (data) => setJobId(data.jobId),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  useEffect(() => {
    if (!jobId) return undefined;
    const interval = setInterval(async () => {
      const res = await api.get(`/api/exams/${examId}/generation/${jobId}`);
      setProgress(res.data.progress);
      if (res.data.state === 'completed') {
        clearInterval(interval);
        toast.success('Questions are ready for review');
        navigate(`/app/exams/${examId}/review`);
      }
      if (res.data.state === 'failed') {
        clearInterval(interval);
        toast.error(res.data.failedReason || 'Generation failed. Your credits have been released.');
        setJobId(null);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [jobId, examId, navigate]);

  if (jobId) {
    const currentIndex = STEPS.findIndex((s) => s.key === progress?.step);
    return (
      <motion.div {...pageEnter} className="max-w-lg mx-auto py-12">
        <p className="text-body text-graphite text-center mb-8">Generating questions&hellip;</p>
        <Card>
          <ul className="space-y-4">
            {STEPS.map((step, i) => {
              const done = currentIndex > i || progress?.step === 'done';
              const active = currentIndex === i;
              return (
                <li key={step.key} className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                      done ? 'bg-ink border-ink' : active ? 'border-marker' : 'border-rule'
                    }`}
                  >
                    {done && <Check size={14} strokeWidth={2} className="text-paper" />}
                  </span>
                  <span className={`text-body ${done || active ? 'text-ink' : 'text-pencil'}`}>{step.label}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <p className="text-small text-pencil text-center mt-4">This usually takes under a minute. You can leave this page — we will email you when it is ready.</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageEnter} className="max-w-lg mx-auto py-12">
      <p className="text-body text-graphite mb-8">Choose how many questions to generate from the source document, and how they should be mixed.</p>

      <Card className="space-y-6">
        <div>
          <Label htmlFor="count">Number of questions</Label>
          <input
            id="count"
            type="range"
            min={5}
            max={100}
            step={5}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-marker"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-[20px] text-ink tabular-nums">{count}</span>
            <span className="text-small text-pencil">questions</span>
          </div>
        </div>

        <div>
          <Label htmlFor="typeMix">Question types</Label>
          <Select id="typeMix" value={typeMix} onChange={(e) => setTypeMix(e.target.value)}>
            <option value="mixed">Mixed (multiple choice, true/false, short answer)</option>
            <option value="mcq">Multiple choice only</option>
            <option value="true_false">True / false only</option>
            <option value="short_answer">Short answer only</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>

        <div className="border-t border-rule pt-5 flex items-center justify-between">
          <div>
            <p className="text-label text-graphite mb-1">Cost</p>
            <p className="font-mono text-[22px] text-ink tabular-nums">{estimate ?? '—'} credits</p>
          </div>
          <Button variant="marker" size="lg" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Starting...' : 'Generate questions'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
