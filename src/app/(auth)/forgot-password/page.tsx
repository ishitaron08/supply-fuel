'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

const schema = z.object({
  email: z.string().email('Invalid email'),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      toast.success('Reset OTP sent to your email');
      router.push(`/reset-password?email=${data.email}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
      <p className="mt-2 text-gray-600">Enter your email and we&apos;ll send you a reset OTP.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="label">Email</label>
          <input {...register('email')} type="email" className="input-field" placeholder="you@company.com" />
          {errors.email && <p className="mt-1 text-sm text-red-600">{String(errors.email.message)}</p>}
        </div>
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send Reset OTP
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
      </p>
    </div>
  );
}
