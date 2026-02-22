'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-600" /></div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const login = useAuthStore((s) => s.login);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { user, accessToken, refreshToken } = res.data.data;

      login(user, accessToken, refreshToken);
      toast.success('Account verified!');

      if (user.role === 'admin') router.push('/admin/dashboard');
      else if (user.role === 'delivery_partner') router.push('/delivery/dashboard');
      else router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
      <p className="mt-2 text-gray-600">
        Enter the 6-digit OTP sent to <span className="font-medium">{email}</span>
      </p>

      <form onSubmit={handleVerify} className="mt-8 space-y-5">
        <div>
          <label className="label">OTP Code</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="input-field text-center text-2xl tracking-[0.5em] font-mono"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify Account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Didn&apos;t receive the code?{' '}
        <button
          onClick={async () => {
            try {
              await api.post('/auth/forgot-password', { email });
              toast.success('New OTP sent!');
            } catch {
              toast.error('Could not resend OTP');
            }
          }}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Resend OTP
        </button>
      </p>
    </div>
  );
}
