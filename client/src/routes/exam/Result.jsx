import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/console/Button';
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
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Preparing your result</h1>
        <p className="text-gray-400">{result.message || 'This will only take a moment.'}</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageEnter}>
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center mb-8">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{result.passed ? 'Passed' : 'Not passed'}</p>
        <p className="font-mono text-6xl text-white tabular-nums leading-none mb-2">{result.percentage}%</p>
        <p className="text-gray-400 font-mono mb-6">{result.score} / {result.totalPoints} points · pass mark {result.passMark}%</p>
        <Button variant="secondary" onClick={downloadPdf} disabled={downloading}>
          <Download size={16} strokeWidth={1.75} /> {downloading ? 'Preparing PDF...' : 'Download result (PDF)'}
        </Button>
      </div>

      {result.breakdown && (
        <div className="space-y-3">
          {result.breakdown.map((item, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {item.isCorrect ? (
                  <Check size={16} strokeWidth={2} className="text-green-400" />
                ) : (
                  <X size={16} strokeWidth={2} className="text-red-400" />
                )}
                <span className="font-mono text-sm text-gray-500">{item.pointsAwarded} / {item.pointsPossible} pts</span>
              </div>
              <p className="text-white mb-1">{item.prompt}</p>
              <p className="text-sm text-gray-400">Your answer: {item.yourAnswer || '(no answer)'}</p>
              {!item.isCorrect && <p className="text-sm text-green-400">Correct answer: {item.correctAnswer}</p>}
              {item.explanation && <p className="text-sm text-gray-500 italic mt-1">Why: {item.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
