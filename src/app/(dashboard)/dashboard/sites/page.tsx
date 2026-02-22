'use client';

import { useEffect, useState } from 'react';
import { Plus, MapPin, Edit, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { useForm } from 'react-hook-form';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Site {
  _id: string;
  siteName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  contactPhone: string;
  isActive: boolean;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const fetchSites = async () => {
    try {
      const { data } = await api.get('/sites');
      setSites(data.data || []);
    } catch {
      toast.error('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSites(); }, []);

  const openCreate = () => {
    setEditingSite(null);
    setModalOpen(true);
  };

  const openEdit = (site: Site) => {
    setEditingSite(site);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this site?')) return;
    try {
      await api.delete(`/sites/${id}`);
      toast.success('Site deleted');
      fetchSites();
    } catch {
      toast.error('Failed to delete site');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Sites</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Site
        </button>
      </div>

      {sites.length === 0 ? (
        <EmptyState title="No delivery sites" description="Add your first delivery site to start placing orders." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sites.map((site) => (
            <div key={site._id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <h3 className="font-semibold text-gray-900">{site.siteName}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(site)} className="p-1.5 text-gray-400 hover:text-primary-600">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(site._id)} className="p-1.5 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">{site.address}</p>
              <p className="text-sm text-gray-600">{site.city}, {site.state} — {site.pincode}</p>
              <p className="text-sm text-gray-500 mt-2">Contact: {site.contactPerson} ({site.contactPhone})</p>
            </div>
          ))}
        </div>
      )}

      <SiteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        site={editingSite}
        onSaved={fetchSites}
      />
    </div>
  );
}

function SiteModal({
  open, onClose, site, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  site: Site | null;
  onSaved: () => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      siteName: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      contactPerson: '',
      contactPhone: '',
    },
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (site) {
      reset({
        siteName: site.siteName,
        address: site.address,
        city: site.city,
        state: site.state,
        pincode: site.pincode,
        contactPerson: site.contactPerson,
        contactPhone: site.contactPhone,
      });
    } else {
      reset({ siteName: '', address: '', city: '', state: '', pincode: '', contactPerson: '', contactPhone: '' });
    }
  }, [site, reset]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      if (site) {
        await api.put(`/sites/${site._id}`, data);
        toast.success('Site updated');
      } else {
        await api.post('/sites', data);
        toast.success('Site created');
      }
      onClose();
      onSaved();
    } catch (err: any) {
      const firstFieldError = err.response?.data?.errors?.[0]?.message;
      toast.error(firstFieldError || err.response?.data?.message || 'Failed to save site');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={site ? 'Edit Site' : 'Add Delivery Site'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Site Name *</label>
          <input {...register('siteName', { required: 'Required' })} className="input-field" />
          {errors.siteName && <p className="text-red-500 text-xs mt-1">{errors.siteName.message}</p>}
        </div>
        <div>
          <label className="label">Address *</label>
          <input {...register('address', { required: 'Required' })} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">City *</label>
            <input {...register('city', { required: 'Required' })} className="input-field" />
          </div>
          <div>
            <label className="label">State *</label>
            <input {...register('state', { required: 'Required' })} className="input-field" />
          </div>
        </div>
        <div>
          <label className="label">Pincode *</label>
          <input {...register('pincode', { required: 'Required' })} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Contact Person *</label>
            <input {...register('contactPerson', { required: 'Required' })} className="input-field" />
          </div>
          <div>
            <label className="label">Contact Phone *</label>
            <input {...register('contactPhone', { required: 'Required' })} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : site ? 'Update Site' : 'Add Site'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
