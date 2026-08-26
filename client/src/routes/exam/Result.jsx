import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/ui/Button';
import { RegistrationMarks } from '../../components/ui/Card';
import { pageEnter } from '../../lib/motion';

export default function Result() {
  const [downloading, setDownloading] = useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ['attempt-result'],
    queryFn: () => api.get('/api/exam/attempt/result').then((r) => r.data),
    refetchInterval: (query) => (query.state.data?.ready ? false : 3000),
  });

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/api/exam/attempt/result/pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'result.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not download your result. Try again.'));
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || !result) return null;

  if (!result.ready) {
    return (
      <motion.div {...pageEnter} className="text-center py-16">
        <h1 className="font-display text-page-title text-ink mb-2">Preparing your result</h1>
        <p className="text-body text-graphite">{result.message || 'This will only take a moment.'}</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageEnter}>
      <RegistrationMarks className="bg-paper border border-rule rounded-card p-8 text-center mb-8">
        <p className="text-label text-graphite mb-3">{result.passed ? 'Passed' : 'Not passed'}</p>
        <p className="font-mono text-[48px] text-ink tabular-nums leading-none mb-2">{result.percentage}%</p>
        <p className="text-body text-graphite font-mono mb-6">{result.score} / {result.totalPoints} points · pass mark {result.passMark}%</p>
        <Button variant="secondary" onClick={downloadPdf} disabled={downloading}>
          <Download size={16} strokeWidth={1.5} /> {downloading ? 'Preparing PDF...' : 'Download result (PDF)'}
        </Button>
      </RegistrationMarks>

      {result.breakdown && (
        <div className="space-y-3">
          {result.breakdown.map((item, i) => (
            <div key={i} className="border border-rule rounded-card p-4">
              <div className="flex items-center gap-2 mb-2">
                {item.isCorrect ? (
                  <Check size={16} strokeWidth={2} className="text-pass" />
                ) : (
                  <X size={16} strokeWidth={2} className="text-fail" />
                )}
                <span className="font-mono text-small text-pencil">{item.pointsAwarded} / {item.pointsPossible} pts</span>
              </div>
              <p className="text-body text-ink mb-1">{item.prompt}</p>
              <p className="text-small text-graphite">Your answer: {item.yourAnswer || '(no answer)'}</p>
              {!item.isCorrect && <p className="text-small text-pass">Correct answer: {item.correctAnswer}</p>}
              {item.explanation && <p className="text-small text-graphite italic mt-1">Why: {item.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
