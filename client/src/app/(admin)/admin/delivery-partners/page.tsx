'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminDeliveryPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPartners = async () => {
    try {
      const { data } = await api.get('/users/delivery-partners');
      setPartners(data.partners || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Partners</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Partner
        </button>
      </div>

      {partners.length === 0 ? (
        <EmptyState title="No delivery partners" description="Add your first delivery partner to assign orders." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">City</th>
                  <th className="px-6 py-3 font-medium">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {partners.map((p: any) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-gray-600">{p.email}</td>
                    <td className="px-6 py-4 text-gray-600">{p.phone || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{p.city || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${p.isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.isVerified ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreatePartnerModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={fetchPartners} />
    </div>
  );
}

function CreatePartnerModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [saving, setSaving] = useState(false);

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      await api.post('/users/delivery-partners', data);
      toast.success('Delivery partner created');
      reset();
      onClose();
      onCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create partner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Delivery Partner">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input {...register('name', { required: 'Required' })} className="input-field" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{String(errors.name.message)}</p>}
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" {...register('email', { required: 'Required' })} className="input-field" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{String(errors.email.message)}</p>}
        </div>
        <div>
          <label className="label">Password *</label>
          <input type="password" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} className="input-field" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{String(errors.password.message)}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input {...register('phone')} className="input-field" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Creating...' : 'Create Partner'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
