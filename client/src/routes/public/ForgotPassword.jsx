import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input, { Label, FieldError } from '../../components/ui/Input';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    await api.post('/api/auth/forgot-password', values).catch(() => {});
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-[20px] text-ink tracking-wide block text-center mb-8">SIDIS</Link>
        <div className="bg-paper border border-rule rounded-card p-8">
          <h1 className="text-card-title text-ink mb-2">Reset your password</h1>
          {isSubmitSuccessful ? (
            <p className="text-body text-graphite">
              If an account exists for that email, a reset link is on its way. Check your inbox.
            </p>
          ) : (
            <>
              <p className="text-body text-graphite mb-6">Enter your email and we will send you a reset link.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email')} />
                  <FieldError>{errors.email?.message}</FieldError>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
