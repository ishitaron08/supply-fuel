'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { Building2, User as UserIcon } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const isOrg = user?.profileType === 'organization';

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
      updateUser(res.data.data);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        {isOrg ? <Building2 className="h-7 w-7 text-orange-600" /> : <UserIcon className="h-7 w-7 text-primary-600" />}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isOrg ? 'Organization Profile' : 'My Profile'}
          </h1>
          <p className="text-sm text-gray-500">
            {isOrg ? 'Manage your organization details and billing information' : 'Manage your personal information'}
          </p>
        </div>
      </div>

      {/* Profile type badge */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 ${isOrg ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
        {isOrg ? <Building2 className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
        {isOrg ? 'Organization Account' : 'Individual Account'}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="label">Email</label>
          <input type="email" value={user?.email || ''} disabled className="input-field bg-gray-50 cursor-not-allowed" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{isOrg ? 'Contact Person Name' : 'Full Name'}</label>
            <input {...register('name', { required: 'Name is required' })} className="input-field" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input {...register('phone')} className="input-field" placeholder="9876543210" />
          </div>
        </div>

        {/* Organization-specific fields */}
        {isOrg && (
          <>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Organization Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Organization Name *</label>
                  <input {...register('organizationName', { required: isOrg ? 'Organization name is required' : false })} className="input-field" />
                </div>
                <div>
                  <label className="label">GST Number</label>
                  <input {...register('gstNumber')} className="input-field" placeholder="22AAAAA0000A1Z5" />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {isOrg ? 'Organization Address' : 'Address'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">{isOrg ? 'Registered Address' : 'Address'}</label>
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
