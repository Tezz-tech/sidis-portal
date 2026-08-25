import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ShieldCheck, Wallet } from 'lucide-react';
import Button from '../../components/ui/Button';
import DemoSequence from './DemoSequence';
import { pageEnter } from '../../lib/motion';

export default function Landing() {
  return (
    <div>
      <section className="max-w-admin mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <motion.div {...pageEnter}>
          <p className="text-label text-marker-deep mb-4">Assessment platform</p>
          <h1 className="font-display text-[40px] leading-tight text-ink mb-5 tracking-tight">
            Turn a document into a finished test in minutes, not hours.
          </h1>
          <p className="text-body text-graphite mb-8 max-w-md">
            Upload lecture notes, a policy manual, or training material. Choose how many questions
            you need. Sidis writes the test, you review it, and your people take it in the browser.
          </p>
          <div className="flex items-center gap-3">
            <Button as={Link} to="/request-workspace" variant="marker" size="lg">
              Request a workspace
            </Button>
            <Button as={Link} to="/pricing" variant="secondary" size="lg">
              See pricing
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.08, ease: [0.2, 0, 0, 1] }}>
          <DemoSequence />
        </motion.div>
      </section>

      <section className="border-t border-rule bg-paper">
        <div className="max-w-admin mx-auto px-6 py-16 grid md:grid-cols-3 gap-10">
          {[
            { icon: Upload, title: 'From document to test', body: 'Upload a PDF or Word file. Pick a question count and difficulty. Every question cites the exact passage it came from.' },
            { icon: ShieldCheck, title: 'Built for real exams', body: 'Server-authoritative timers, autosave, shuffled questions, and integrity logging — the exam survives a dropped connection.' },
            { icon: Wallet, title: 'Pay for what you use', body: 'Credits cover generation and grading. The cost is shown before you confirm, every time. No surprise charges.' },
          ].map((f) => (
            <div key={f.title}>
              <div className="w-10 h-10 rounded-card border border-rule flex items-center justify-center text-graphite mb-4">
                <f.icon size={18} strokeWidth={1.5} />
              </div>
              <h3 className="text-card-title text-ink mb-2">{f.title}</h3>
              <p className="text-body text-graphite">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
