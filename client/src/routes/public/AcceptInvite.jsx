import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input, { Label, FieldError, FieldHint } from '../../components/ui/Input';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      await api.post('/api/auth/accept-invite', { token, password: values.password });
      await refetch();
      toast.success('Your account is ready');
      navigate('/app');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'This invite link is invalid or has expired'));
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-body text-graphite">This invite link is missing a token. Ask your admin to resend it.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-[20px] text-ink tracking-wide block text-center mb-8">SIDIS</Link>
        <div className="bg-paper border border-rule rounded-card p-8">
          <h1 className="text-card-title text-ink mb-2">Set your password</h1>
          <p className="text-body text-graphite mb-6">Choose a password to finish setting up your account.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              <FieldError>{errors.password?.message}</FieldError>
              <FieldHint>At least 8 characters.</FieldHint>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Setting up...' : 'Set password and continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
