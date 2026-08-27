import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, FileText, Zap, ShieldCheck } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import MarketingButton from './marketing/MarketingButton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const schema = z.object({
  organizationName: z.string().min(1, 'Enter your organization name'),
  firstName: z.string().min(1, 'Enter your first name'),
  lastName: z.string().min(1, 'Enter your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  organizationType: z.enum(['school', 'company', 'other']),
  message: z.string().optional(),
});

const PERKS = [
  { icon: Zap, text: 'Your workspace is live the moment you submit — no waiting on manual approval.' },
  { icon: FileText, text: 'Generate your first exam from a document in minutes.' },
  { icon: ShieldCheck, text: 'No card required. Credits only cover what you actually generate and grade.' },
];

const fieldClasses = 'w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 backdrop-blur-xl';

function GlowField({ children }) {
  return (
    <div className="relative group">
      <span className="absolute -inset-0.5 -z-10 rounded-2xl bg-gradient-to-r from-orange-500/20 to-pink-600/20 opacity-0 blur-xl transition-opacity duration-300 group-focus-within:opacity-100 pointer-events-none" />
      {children}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <GlowField>{children}</GlowField>
      {error && <p className="text-red-400 text-sm mt-1.5">{error}</p>}
    </div>
  );
}

export default function RequestWorkspace() {
  useDocumentTitle('Request a workspace — Sidis');
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { organizationType: 'company' },
  });

  const onSubmit = async (values) => {
    try {
      await api.post('/api/public/leads', values);
      toast.success('Your workspace is ready — check your email to set your password.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] grid lg:grid-cols-2">
      <section className="relative bg-gradient-to-br from-orange-600/20 via-pink-600/20 to-purple-600/20 bg-gray-950 px-8 sm:px-14 py-16 flex flex-col justify-center">
        <p className="text-orange-400 font-bold tracking-widest text-sm uppercase mb-4">Get started</p>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight leading-[1.1]">
          Your workspace, <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">ready in seconds.</span>
        </h1>
        <p className="text-lg text-gray-300 mb-10 max-w-sm leading-relaxed">
          Tell us a little about your organization and we&rsquo;ll set everything up right away.
        </p>
        <ul className="space-y-5 max-w-sm">
          {PERKS.map((perk, i) => (
            <motion.li
              key={perk.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
              className="flex items-start gap-3"
            >
              <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                <perk.icon size={16} strokeWidth={2} />
              </span>
              <span className="text-gray-300 leading-relaxed">{perk.text}</span>
            </motion.li>
          ))}
        </ul>
      </section>

      <section className="bg-gray-950 px-8 sm:px-14 py-16 flex items-center">
        <div className="w-full max-w-md mx-auto">
          {isSubmitSuccessful ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-orange-500/40">
                <CheckCircle2 size={28} strokeWidth={1.75} />
              </div>
              <h2 className="text-2xl font-black text-white mb-3">You&rsquo;re all set</h2>
              <p className="text-gray-400 leading-relaxed">
                Your workspace has been created. Check your email for a link to set your password and sign in.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <h2 className="text-2xl font-black text-white mb-1">Request a workspace</h2>
              <p className="text-sm text-gray-500 mb-6">Free to start. Set up takes less than a minute.</p>

              <Field label="Organization name" error={errors.organizationName?.message}>
                <input className={fieldClasses} {...register('organizationName')} />
              </Field>

              <Field label="Organization type">
                <select className={`${fieldClasses} appearance-none`} {...register('organizationType')}>
                  <option value="company" className="bg-gray-900">Company</option>
                  <option value="school" className="bg-gray-900">School</option>
                  <option value="other" className="bg-gray-900">Other</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" error={errors.firstName?.message}>
                  <input className={fieldClasses} {...register('firstName')} />
                </Field>
                <Field label="Last name" error={errors.lastName?.message}>
                  <input className={fieldClasses} {...register('lastName')} />
                </Field>
              </div>

              <Field label="Work email" error={errors.email?.message}>
                <input type="email" className={fieldClasses} {...register('email')} />
              </Field>

              <Field label="Phone (optional)">
                <input className={fieldClasses} {...register('phone')} />
              </Field>

              <Field label="What are you looking to assess? (optional)">
                <textarea rows={3} className={fieldClasses} {...register('message')} />
              </Field>

              <MarketingButton type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Creating your workspace...' : 'Create my workspace'}
              </MarketingButton>

              <p className="text-xs text-gray-500 text-center">
                By continuing you agree to our{' '}
                <Link to="/terms" className="text-gray-400 hover:text-orange-400 underline transition-colors duration-200">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-gray-400 hover:text-orange-400 underline transition-colors duration-200">Privacy Policy</Link>.
              </p>
            </motion.form>
          )}
        </div>
      </section>
    </div>
  );
}
