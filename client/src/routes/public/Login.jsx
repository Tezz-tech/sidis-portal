import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiErrorMessage } from '../../lib/api';
import MarketingButton from './marketing/MarketingButton';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

const fieldClasses = 'w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 backdrop-blur-xl';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const user = await login(values.email, values.password);
      const from = location.state?.from?.pathname;
      if (user.role === 'platform_owner') navigate('/admin');
      else navigate(from || '/app');
    } catch (err) {
      setFormError(apiErrorMessage(err, 'That email or password is incorrect'));
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-950">
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="block text-center mb-10">
            <span className="text-2xl font-black text-white">
              Sidis<span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">.</span>
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8"
          >
            <h1 className="text-2xl font-black text-white mb-6">Sign in</h1>

            {formError && (
              <div className="flex items-start gap-2.5 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-300 text-sm p-4 mb-5">
                <AlertCircle size={16} strokeWidth={2} className="shrink-0 mt-0.5" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" className={fieldClasses} {...register('email')} />
                {errors.email && <p className="text-red-400 text-sm mt-1.5">{errors.email.message}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300" htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="text-sm text-orange-400 hover:text-orange-300 transition-colors duration-300">
                    Forgot password?
                  </Link>
                </div>
                <input id="password" type="password" autoComplete="current-password" className={fieldClasses} {...register('password')} />
                {errors.password && <p className="text-red-400 text-sm mt-1.5">{errors.password.message}</p>}
              </div>
              <MarketingButton type="submit" className="w-full" size="md" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </MarketingButton>
            </form>
          </motion.div>
        </div>
      </section>

      <section className="hidden lg:flex relative items-center justify-center bg-gradient-to-br from-orange-600/20 via-pink-600/20 to-purple-600/20 bg-black overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative text-center px-12 max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-orange-500/40">
            <Sparkles className="w-8 h-8" strokeWidth={1.75} />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Welcome back!</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Pick up right where you left off — generate a new exam or check in on results coming in live.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
