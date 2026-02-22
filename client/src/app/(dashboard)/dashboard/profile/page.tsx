'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      organizationName: user?.organizationName || '',
      gstNumber: user?.gstNumber || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
    },
  });

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const res = await api.put('/users/profile', data);
      updateUser(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="label">Email</label>
          <input type="email" value={user?.email || ''} disabled className="input-field bg-gray-50 cursor-not-allowed" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input {...register('name', { required: 'Name is required' })} className="input-field" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input {...register('phone')} className="input-field" placeholder="9876543210" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Organization Name</label>
            <input {...register('organizationName')} className="input-field" />
          </div>
          <div>
            <label className="label">GST Number</label>
            <input {...register('gstNumber')} className="input-field" placeholder="22AAAAA0000A1Z5" />
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <input {...register('address')} className="input-field" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">City</label>
            <input {...register('city')} className="input-field" />
          </div>
          <div>
            <label className="label">State</label>
            <input {...register('state')} className="input-field" />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
