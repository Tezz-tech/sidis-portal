import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ShieldCheck, Wallet, Sparkles, FileText, Brain, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import DemoSequence from './DemoSequence';
import GradientBlobs from './marketing/GradientBlobs';
import MarketingButton from './marketing/MarketingButton';

const EASE = [0.16, 1, 0.3, 1];

const headline = ['Turn a document', 'into a finished test', 'in minutes, not hours.'];

const wordVariants = {
  initial: { opacity: 0, y: '100%' },
  animate: (i) => ({ opacity: 1, y: '0%', transition: { duration: 0.7, delay: 0.15 + i * 0.09, ease: EASE } }),
};

const revealUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: EASE },
};

const FEATURES = [
  { icon: Upload, title: 'From document to test', body: 'Upload a PDF or Word file. Pick a question count and difficulty. Every question cites the exact passage it came from.', big: true },
  { icon: ShieldCheck, title: 'Built for real exams', body: 'Server-authoritative timers, autosave, shuffled questions, and integrity logging — the exam survives a dropped connection.' },
  { icon: Wallet, title: 'Pay for what you use', body: 'Credits cover generation and grading. The cost is shown before you confirm, every time.' },
  { icon: Brain, title: 'AI-graded short answers', body: 'Free-text responses are graded with reasoning attached, so you can see exactly why a score was given.' },
];

const STEPS = [
  { icon: FileText, label: 'Upload', body: 'Drop in a document — lecture notes, a policy manual, training material.' },
  { icon: Sparkles, label: 'Generate', body: 'Choose a question count and mix. The AI writes and cites every question.' },
  { icon: CheckCircle2, label: 'Publish', body: 'Review, invite participants, and watch results come in live.' },
];

export default function Landing() {
  return (
    <div className="bg-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative bg-void pt-20 pb-28">
        <GradientBlobs />
        <div className="bg-grid absolute inset-0" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }} />

        <div className="relative max-w-admin mx-auto px-6 grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm mb-7"
            >
              <Zap size={13} strokeWidth={2} className="text-lime" />
              <span className="text-[12px] font-inter font-medium tracking-wide text-white/80">AI-powered assessment platform</span>
            </motion.div>

            <h1 className="font-grotesk text-[44px] sm:text-[56px] leading-[1.05] font-bold text-white mb-7 tracking-tight">
              {headline.map((line, li) => (
                <span key={li} className="block overflow-hidden">
                  <motion.span
                    custom={li}
                    initial="initial"
                    animate="animate"
                    variants={wordVariants}
                    className={li === 1 ? 'inline-block text-gradient' : 'inline-block'}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-[17px] font-inter text-white/60 mb-9 max-w-md leading-relaxed"
            >
              Upload lecture notes, a policy manual, or training material. Choose how many questions
              you need. Sidis writes the test, you review it, and your people take it in the browser.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="flex flex-wrap items-center gap-4"
            >
              <MarketingButton as={Link} to="/request-workspace" size="lg">
                Request a workspace <ArrowRight size={17} strokeWidth={2} />
              </MarketingButton>
              <MarketingButton as={Link} to="/pricing" variant="ghost" size="lg">
                See pricing
              </MarketingButton>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            whileHover={{ rotate: -1, y: -4 }}
          >
            <DemoSequence />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-mist py-24">
        <div className="max-w-admin mx-auto px-6">
          <motion.div {...revealUp} className="max-w-lg mb-14">
            <p className="text-[12px] font-inter font-semibold tracking-widest text-violet uppercase mb-3">Why Sidis</p>
            <h2 className="font-grotesk text-[32px] sm:text-[38px] font-bold text-void leading-tight tracking-tight">
              Everything a real assessment needs, none of the busywork.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...revealUp}
                transition={{ ...revealUp.transition, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className={`group relative rounded-3xl border border-violet/10 bg-white p-8 transition-shadow duration-300 hover:shadow-[0_20px_60px_-15px_rgba(124,92,252,0.25)] ${f.big ? 'md:col-span-2' : ''}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet to-cyan flex items-center justify-center text-white mb-5 shadow-[0_8px_20px_-6px_rgba(124,92,252,0.5)] group-hover:scale-110 transition-transform duration-300">
                  <f.icon size={20} strokeWidth={1.75} />
                </div>
                <h3 className="font-grotesk text-[19px] font-bold text-void mb-2">{f.title}</h3>
                <p className="text-[15px] font-inter text-void/60 leading-relaxed max-w-md">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-24 border-t border-violet/10">
        <div className="max-w-admin mx-auto px-6">
          <motion.div {...revealUp} className="text-center max-w-lg mx-auto mb-16">
            <p className="text-[12px] font-inter font-semibold tracking-widest text-violet uppercase mb-3">How it works</p>
            <h2 className="font-grotesk text-[32px] sm:text-[38px] font-bold text-void leading-tight tracking-tight">Three steps to a live exam</h2>
          </motion.div>

          <div className="relative grid md:grid-cols-3 gap-10">
            <div className="hidden md:block absolute top-8 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-violet/0 via-violet/30 to-violet/0" />
            {STEPS.map((step, i) => (
              <motion.div key={step.label} {...revealUp} transition={{ ...revealUp.transition, delay: i * 0.12 }} className="relative text-center">
                <div className="relative z-10 w-16 h-16 mx-auto rounded-2xl bg-void flex items-center justify-center text-lime mb-6 shadow-[0_12px_30px_-10px_rgba(8,8,13,0.4)]">
                  <step.icon size={24} strokeWidth={1.75} />
                </div>
                <p className="font-grotesk text-[18px] font-bold text-void mb-2">{i + 1}. {step.label}</p>
                <p className="text-[14px] font-inter text-void/55 leading-relaxed max-w-xs mx-auto">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative bg-void py-24 overflow-hidden">
        <GradientBlobs />
        <motion.div {...revealUp} className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-grotesk text-[32px] sm:text-[42px] font-bold text-white mb-5 tracking-tight leading-tight">
            Your next exam is one document away.
          </h2>
          <p className="text-[16px] font-inter text-white/60 mb-9 max-w-md mx-auto">
            No subscriptions. No per-seat pricing. Just credits for what you actually generate and grade.
          </p>
          <MarketingButton as={Link} to="/request-workspace" size="lg">
            Request a workspace <ArrowRight size={17} strokeWidth={2} />
          </MarketingButton>
        </motion.div>
      </section>
    </div>
  );
}
