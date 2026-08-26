import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ShieldCheck, Wallet, Brain, FileText, Sparkles, CheckCircle2, ArrowRight, ListChecks } from 'lucide-react';
import DemoSequence from './DemoSequence';
import MarketingButton from './marketing/MarketingButton';
import GlassCard from './marketing/GlassCard';

const FEATURES = [
  { icon: Upload, title: 'From document to test', body: 'Upload a PDF or Word file. Pick a question count and difficulty. Every question cites the exact passage it came from.', color: 'from-orange-500 to-pink-600' },
  { icon: ShieldCheck, title: 'Built for real exams', body: 'Server-authoritative timers, autosave, shuffled questions, and integrity logging — the exam survives a dropped connection.', color: 'from-pink-500 to-purple-600' },
  { icon: Wallet, title: 'Pay for what you use', body: 'Credits cover generation and grading. The cost is shown before you confirm, every time.', color: 'from-purple-500 to-orange-600' },
  { icon: Brain, title: 'AI-graded short answers', body: 'Free-text responses are graded with reasoning attached, so you can see exactly why a score was given.', color: 'from-orange-500 to-red-500' },
];

const STEPS = [
  { icon: FileText, label: 'Upload', body: 'Drop in a document — lecture notes, a policy manual, training material.' },
  { icon: Sparkles, label: 'Generate', body: 'Choose a question count and mix. The AI writes and cites every question.' },
  { icon: CheckCircle2, label: 'Publish', body: 'Review, invite participants, and watch results come in live.' },
];

const CHECKLIST = [
  'AI writes every question straight from your document — nothing generic',
  'Server-side timers and autosave keep an exam honest and crash-proof',
  'Short-answer responses get graded with reasoning, not just right/wrong',
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-950 via-black to-gray-950 pt-20 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40 mb-8">
              <Sparkles size={14} strokeWidth={2.5} className="text-orange-400" />
              <span className="text-xs font-bold text-orange-300 tracking-wide">AI-POWERED ASSESSMENT PLATFORM</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight">
              Turn a document into a{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600">
                finished test
              </span>{' '}
              in minutes.
            </h1>

            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-lg leading-relaxed">
              Upload lecture notes, a policy manual, or training material. Choose how many questions
              you need. Sidis writes the test, you review it, and your people take it in the browser.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <MarketingButton to="/request-workspace">
                Request a workspace <ArrowRight className="w-6 h-6" />
              </MarketingButton>
              <MarketingButton to="/pricing" variant="secondary" className="rounded-xl">
                See pricing
              </MarketingButton>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <DemoSequence />
          </motion.div>
        </div>
      </section>

      {/* What is Sidis */}
      <section className="bg-gradient-to-b from-gray-950 to-black py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600"
          >
            What is Sidis?
          </motion.h2>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Sidis is an AI assessment platform that reads whatever document you already have and turns it
                into a real, gradeable exam — timed, shuffled, and scored automatically, with every question
                traceable back to the exact passage it came from.
              </p>
              <div className="bg-gradient-to-r from-orange-500/10 to-pink-600/10 border border-orange-500/30 rounded-3xl backdrop-blur-xl p-6">
                <ul className="space-y-4">
                  {CHECKLIST.map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ListChecks size={12} strokeWidth={2.5} className="text-white" />
                      </span>
                      <span className="text-gray-300">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <GlassCard delay={0.1} className="p-10 flex flex-col items-center text-center" hover={false}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white mb-6 shadow-2xl shadow-orange-500/40">
                <Brain className="w-10 h-10" strokeWidth={1.75} />
              </div>
              <p className="text-2xl font-bold text-white mb-3 leading-snug">
                From upload to results, without the busywork.
              </p>
              <p className="text-gray-400 mb-8">
                No more writing questions by hand or grading free-text answers one by one.
              </p>
              <MarketingButton to="/request-workspace" size="md">
                Try it now <ArrowRight className="w-5 h-5" />
              </MarketingButton>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gradient-to-b from-black to-gray-950 py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-center text-white mb-16"
          >
            Everything a real exam needs
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <GlassCard key={f.title} delay={i * 0.1} className="p-8">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-5 shadow-xl`}>
                  <f.icon className="w-7 h-7" strokeWidth={1.75} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.body}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-b from-gray-950 to-black py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-center text-white mb-20"
          >
            Three steps to a live exam
          </motion.h2>

          <div className="relative grid md:grid-cols-3 gap-12">
            <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/50 to-orange-500/0" />
            {STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="relative z-10 w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white mb-6 shadow-2xl shadow-orange-500/40">
                  <step.icon className="w-9 h-9" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-black text-white mb-3">{i + 1}. {step.label}</p>
                <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-gradient-to-t from-black to-gray-950 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto px-4 sm:px-6 text-center"
        >
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
            Your next exam is{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">one document</span> away.
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-md mx-auto">
            No subscriptions. No per-seat pricing. Just credits for what you actually generate and grade.
          </p>
          <MarketingButton to="/request-workspace">
            Request a workspace <ArrowRight className="w-6 h-6" />
          </MarketingButton>
        </motion.div>
      </section>
    </div>
  );
}
