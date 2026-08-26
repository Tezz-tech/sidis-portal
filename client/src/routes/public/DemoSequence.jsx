import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, Sparkles } from 'lucide-react';

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
    <div className="relative rounded-3xl border border-white/10 bg-voidsoft/80 backdrop-blur-xl p-6 min-h-[420px] shadow-[0_0_60px_rgba(124,92,252,0.15)]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet/60 to-transparent" />
      <div className="flex items-center gap-2 mb-5 text-[12px] font-inter font-medium text-violet">
        <Sparkles size={13} strokeWidth={2} />
        LIVE GENERATION
      </div>
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
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <FileText size={18} strokeWidth={1.5} className="text-cyan shrink-0" />
                  <div>
                    <p className="text-[14px] font-inter text-white font-medium">{step.label}</p>
                    <p className="text-[12px] font-mono text-white/40">{step.meta}</p>
                  </div>
                </div>
              )}
              {step.kind === 'status' && (
                <div className="flex items-center gap-2 text-[13px] font-inter text-white/60 pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                  {step.label}
                </div>
              )}
              {step.kind === 'question' && (
                <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
                  <p className="text-[11px] font-mono tracking-widest text-white/40 mb-2">QUESTION {step.number}</p>
                  <p className="text-[14px] font-inter text-white mb-3 leading-relaxed">{step.prompt}</p>
                  <div className="space-y-1.5">
                    {step.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] font-inter ${
                          oi === step.correct ? 'border-lime/40 bg-lime/10 text-white' : 'border-white/10 text-white/50'
                        }`}
                      >
                        {oi === step.correct ? (
                          <Check size={14} strokeWidth={2} className="text-lime shrink-0" />
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
