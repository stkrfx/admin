'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, AlertCircle, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';

// Strict Validation
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError('Invalid credentials. Please try again.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Changed min-h-screen to min-h-[100dvh] for mobile browsers
    <div className="w-full flex bg-white min-h-[100dvh]">
      {/* LEFT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 relative z-10">
        
        {/* Mobile Header Doodle (Visible only on small screens) */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-2xl mb-6 shadow-xl shadow-blue-900/20">
              M
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
            <p className="mt-2 text-slate-500">
              Enter your credentials to access the admin portal.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none bg-slate-50 focus:bg-white"
                placeholder="name@mindnamo.com"
                disabled={isLoading}
              />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none bg-slate-50 focus:bg-white pr-12"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              // Added 'h-12' to enforce fixed height regardless of content
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Secured by Mind Namo Admin System v2.0
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Doodle/Illustration Area */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 relative overflow-hidden items-center justify-center border-l border-slate-100">
        {/* Abstract Background Doodles */}
        <div className="absolute inset-0 z-0 opacity-40">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path fill="#E0E7FF" d="M0 0 L100 0 L100 100 L0 100 Z" />
              <path fill="#C7D2FE" d="M0 100 C 20 0 50 0 100 100 Z" className="opacity-50" />
           </svg>
        </div>

        <div className="relative z-10 text-center p-12 max-w-lg">
          <div className="w-64 h-64 bg-white rounded-full mx-auto mb-8 shadow-2xl flex items-center justify-center relative">
            {/* Simple Animated Icon Doodle */}
            <div className="relative w-32 h-32">
                <Lock className="w-full h-full text-blue-600 opacity-90" strokeWidth={1.5} />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute bottom-0 -left-4 w-12 h-12 bg-purple-400 rounded-full opacity-50 blur-xl"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Secure. Powerful. Simple.</h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Manage your users, experts, and content with the new comprehensive admin dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}