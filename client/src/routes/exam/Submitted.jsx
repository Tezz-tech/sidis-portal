import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import { pageEnter } from '../../lib/motion';

export default function Submitted() {
  const { token } = useParams();
  const navigate = useNavigate();

  return (
    <motion.div {...pageEnter} className="text-center py-16">
      <div className="w-12 h-12 rounded-full bg-pass/10 flex items-center justify-center mx-auto mb-6">
        <Check size={22} strokeWidth={2} className="text-pass" />
      </div>
      <h1 className="font-display text-page-title text-ink mb-2">Submitted</h1>
      <p className="text-body text-graphite mb-8">Your result is being prepared. You can check back for it below.</p>
      <Button variant="secondary" onClick={() => navigate(`/exam/${token}/result`)}>
        View result
      </Button>
    </motion.div>
  );
}
