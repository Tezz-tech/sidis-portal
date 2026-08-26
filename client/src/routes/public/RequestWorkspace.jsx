import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/ui/Button';
import Input, { Label, FieldError } from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';

const schema = z.object({
  organizationName: z.string().min(1, 'Enter your organization name'),
  firstName: z.string().min(1, 'Enter your first name'),
  lastName: z.string().min(1, 'Enter your last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  organizationType: z.enum(['school', 'company', 'other']),
  message: z.string().optional(),
});

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
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="font-display text-page-title text-ink mb-2">Request a workspace</h1>
      <p className="text-body text-graphite mb-8">
        Tell us about your organization. Your workspace is created immediately and we&rsquo;ll email you an admin invite.
      </p>

      {isSubmitSuccessful ? (
        <Card>
          <p className="text-body text-ink">Your workspace has been created. Check your email for a link to set your password and sign in.</p>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          <Button type="submit" variant="marker" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send request'}
          </Button>
        </form>
      )}
    </div>
  );
}
