import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Input, { Label, FieldError } from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import MarketingButton from './marketing/MarketingButton';
import GradientBlobs from './marketing/GradientBlobs';

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
  { icon: Sparkles, text: 'Generate your first exam from a document in minutes.' },
  { icon: ShieldCheck, text: 'No card required. Credits only cover what you actually generate and grade.' },
];

export default function RequestWorkspace() {
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
    <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
      <section className="relative bg-void px-8 sm:px-14 py-16 flex flex-col justify-center overflow-hidden">
        <GradientBlobs />
        <div className="relative">
          <p className="text-[12px] font-inter font-semibold tracking-widest text-lime uppercase mb-4">Get started</p>
          <h1 className="font-grotesk text-[34px] sm:text-[42px] font-bold text-white mb-6 tracking-tight leading-[1.1]">
            Your workspace, ready in seconds.
          </h1>
          <p className="text-[16px] font-inter text-white/60 mb-10 max-w-sm leading-relaxed">
            Tell us a little about your organization and we&rsquo;ll set everything up right away.
          </p>
          <ul className="space-y-5 max-w-sm">
            {PERKS.map((perk, i) => (
              <motion.li
                key={perk.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
                className="flex items-start gap-3"
              >
                <span className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-lime shrink-0 mt-0.5">
                  <perk.icon size={15} strokeWidth={2} />
                </span>
                <span className="text-[14px] font-inter text-white/70 leading-relaxed">{perk.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white px-8 sm:px-14 py-16 flex items-center">
        <div className="w-full max-w-md mx-auto">
          {isSubmitSuccessful ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-violet-soft flex items-center justify-center text-violet mx-auto mb-6">
                <CheckCircle2 size={26} strokeWidth={1.75} />
              </div>
              <h2 className="font-grotesk text-[24px] font-bold text-void mb-3">You&rsquo;re all set</h2>
              <p className="text-[15px] font-inter text-void/60 leading-relaxed">
                Your workspace has been created. Check your email for a link to set your password and sign in.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <h2 className="font-grotesk text-[24px] font-bold text-void mb-1">Request a workspace</h2>
              <p className="text-[14px] font-inter text-void/50 mb-6">Free to start. Set up takes less than a minute.</p>

              <div>
                <Label htmlFor="organizationName">Organization name</Label>
                <Input id="organizationName" {...register('organizationName')} />
                <FieldError>{errors.organizationName?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="organizationType">Organization type</Label>
                <Select id="organizationType" {...register('organizationType')}>
                  <option value="company">Company</option>
                  <option value="school">School</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" {...register('firstName')} />
                  <FieldError>{errors.firstName?.message}</FieldError>
                </div>
                <div>
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" {...register('lastName')} />
                  <FieldError>{errors.lastName?.message}</FieldError>
                </div>
              </div>
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" {...register('email')} />
                <FieldError>{errors.email?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" {...register('phone')} />
              </div>
              <div>
                <Label htmlFor="message">What are you looking to assess? (optional)</Label>
                <Textarea id="message" {...register('message')} />
              </div>
              <MarketingButton as="button" type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Creating your workspace...' : 'Create my workspace'}
              </MarketingButton>
            </motion.form>
          )}
        </div>
      </section>
    </div>
  );
}
