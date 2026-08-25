import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check } from 'lucide-react';

const STEPS = [
  { kind: 'file', label: 'staff-handbook.pdf', meta: '38 pages · 41,208 characters' },
  { kind: 'status', label: 'Reading document' },
  { kind: 'status', label: 'Writing questions' },
  {
    kind: 'question',
    number: 1,
    prompt: 'An employee wants to resign. What is the standard notice period stated in the handbook?',
    options: ['2 weeks', '30 days', '60 days', '90 days'],
    correct: 1,
  },
  {
    kind: 'question',
    number: 2,
    prompt: 'True or false: remote staff are required to log hours in the timesheet portal daily.',
    options: ['True', 'False'],
    correct: 0,
  },
  {
    kind: 'question',
    number: 3,
    prompt: 'What must an employee submit within 48 hours of a workplace incident?',
    options: ['An incident report', 'A leave request', 'A performance review', 'An expense claim'],
    correct: 0,
  },
];

export default function DemoSequence() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= STEPS.length) return undefined;
    const delay = STEPS[visibleCount]?.kind === 'status' ? 700 : 900;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount]);

  const visible = STEPS.slice(0, visibleCount);

  return (
    <div className="bg-paper border border-rule rounded-card p-6 min-h-[420px]">
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {visible.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
            >
              {step.kind === 'file' && (
                <div className="flex items-center gap-3 p-3 rounded-card bg-sheet border border-rule">
                  <FileText size={18} strokeWidth={1.5} className="text-graphite shrink-0" />
                  <div>
                    <p className="text-body text-ink font-medium">{step.label}</p>
                    <p className="text-small text-pencil font-mono">{step.meta}</p>
                  </div>
                </div>
              )}
              {step.kind === 'status' && (
                <div className="flex items-center gap-2 text-small text-graphite pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-marker" />
                  {step.label}
                </div>
              )}
              {step.kind === 'question' && (
                <div className="p-4 rounded-card border border-rule">
                  <p className="text-label text-pencil mb-2 font-mono">QUESTION {step.number}</p>
                  <p className="text-body text-ink mb-3">{step.prompt}</p>
                  <div className="space-y-1.5">
                    {step.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 px-3 py-2 rounded-chip border text-small ${
                          oi === step.correct ? 'border-pass/40 bg-pass/5 text-ink' : 'border-rule text-graphite'
                        }`}
                      >
                        {oi === step.correct ? (
                          <Check size={14} strokeWidth={2} className="text-pass shrink-0" />
                        ) : (
                          <span className="w-3.5 shrink-0" />
                        )}
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
