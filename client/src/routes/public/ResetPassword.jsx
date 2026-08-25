import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/ui/Button';
import Input, { Label, FieldError, FieldHint } from '../../components/ui/Input';

const schema = z.object({ password: z.string().min(8, 'Password must be at least 8 characters') });

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      await api.post('/api/auth/reset-password', { token, password: values.password });
      toast.success('Password reset. Sign in with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'This reset link is invalid or has expired'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-[20px] text-ink tracking-wide block text-center mb-8">SIDIS</Link>
        <div className="bg-paper border border-rule rounded-card p-8">
          <h1 className="text-card-title text-ink mb-6">Choose a new password</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              <FieldError>{errors.password?.message}</FieldError>
              <FieldHint>At least 8 characters.</FieldHint>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
