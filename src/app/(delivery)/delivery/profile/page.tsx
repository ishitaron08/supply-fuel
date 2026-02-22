'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Truck, Mail, Phone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function DeliveryProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
    },
  });

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const res = await api.put('/users/profile', data);
      updateUser(res.data.data);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Account info card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <Truck className="h-8 w-8 text-primary-600" />
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold text-gray-900">{user?.name}</p>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Mail className="h-4 w-4" /> {user?.email}
          </div>
          {user?.phone && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Phone className="h-4 w-4" /> {user.phone}
            </div>
          )}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Delivery Partner
          </span>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="label">Email</label>
          <input type="email" value={user?.email || ''} disabled className="input-field bg-gray-50 cursor-not-allowed" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input {...register('name', { required: 'Required' })} className="input-field" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input {...register('phone')} className="input-field" />
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
