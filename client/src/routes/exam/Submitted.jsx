import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Button from '../../components/console/Button';
import { pageEnter } from '../../lib/motion';

export default function Submitted() {
  const { token } = useParams();
  const navigate = useNavigate();

  return (
    <motion.div {...pageEnter} className="text-center py-16">
      <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-6">
        <Check size={22} strokeWidth={2} className="text-green-400" />
      </div>
      <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Submitted</h1>
      <p className="text-gray-400 mb-8">Your result is being prepared. You can check back for it below.</p>
      <Button variant="secondary" onClick={() => navigate(`/exam/${token}/result`)}>
        View result
      </Button>
    </motion.div>
  );
}
