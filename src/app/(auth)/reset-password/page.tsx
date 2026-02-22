'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

const schema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Minimum 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-600" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp: data.otp, newPassword: data.newPassword });
      toast.success('Password reset successful!');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
      <p className="mt-2 text-gray-600">
        Enter the OTP sent to <span className="font-medium">{email}</span> and your new password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="label">OTP Code</label>
          <input
            {...register('otp')}
            className="input-field text-center text-xl tracking-[0.5em] font-mono"
            placeholder="000000"
            maxLength={6}
          />
          {errors.otp && <p className="mt-1 text-sm text-red-600">{String(errors.otp.message)}</p>}
        </div>
        <div>
          <label className="label">New Password</label>
          <input {...register('newPassword')} type="password" className="input-field" placeholder="••••••••" />
          {errors.newPassword && <p className="mt-1 text-sm text-red-600">{String(errors.newPassword.message)}</p>}
        </div>
        <div>
          <label className="label">Confirm Password</label>
          <input {...register('confirmPassword')} type="password" className="input-field" placeholder="••••••••" />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{String(errors.confirmPassword.message)}</p>}
        </div>
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Reset Password
        </button>
      </form>
    </div>
  );
}
