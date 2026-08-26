import { useEffect, useRef, useState } from 'react';
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
  const scrollRef = useRef(null);

  useEffect(() => {
    if (visibleCount >= STEPS.length) return undefined;
    const delay = STEPS[visibleCount]?.kind === 'status' ? 700 : 900;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount]);

  // A fixed height (not min-height) matters here: this card sits beside the
  // hero text in a two-column row, and used to grow taller as each step
  // revealed — which kept re-centering the whole row and dragging the text
  // sibling down with it. Fixed height + auto-scroll keeps the outer card
  // size constant for the life of the component, so the row it's in never
  // resizes.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [visibleCount]);

  const visible = STEPS.slice(0, visibleCount);

  return (
    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6 h-[420px] flex flex-col">
      <div className="flex items-center gap-2 mb-5 text-xs font-bold tracking-widest text-orange-400 uppercase shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        Live generation
      </div>
      <div ref={scrollRef} className="space-y-3 overflow-y-auto scrollbar-none">
        <AnimatePresence initial={false}>
          {visible.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {step.kind === 'file' && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <FileText size={20} strokeWidth={1.75} className="text-orange-400 shrink-0" />
                  <div>
                    <p className="text-white font-medium">{step.label}</p>
                    <p className="text-xs text-gray-500">{step.meta}</p>
                  </div>
                </div>
              )}
              {step.kind === 'status' && (
                <div className="flex items-center gap-2 text-sm text-gray-400 pl-1">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 animate-pulse" />
                  {step.label}
                </div>
              )}
              {step.kind === 'question' && (
                <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
                  <p className="text-xs font-bold tracking-widest text-gray-500 mb-2">QUESTION {step.number}</p>
                  <p className="text-white mb-4 leading-relaxed">{step.prompt}</p>
                  <div className="space-y-2">
                    {step.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm ${
                          oi === step.correct ? 'border-green-500/40 bg-green-500/10 text-white' : 'border-white/10 text-gray-400'
                        }`}
                      >
                        {oi === step.correct ? (
                          <Check size={15} strokeWidth={2.5} className="text-green-400 shrink-0" />
                        ) : (
                          <span className="w-4 shrink-0" />
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
