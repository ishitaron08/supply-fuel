'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  type: string;
  capacity: number;
  driverId?: any;
  isAvailable: boolean;
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data.vehicles || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch {
      toast.error('Failed to delete vehicle');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Vehicle
        </button>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState title="No vehicles" description="Add a vehicle to start assigning deliveries." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-6 py-3 font-medium">Vehicle #</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Capacity (L)</th>
                  <th className="px-6 py-3 font-medium">Driver</th>
                  <th className="px-6 py-3 font-medium">Available</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{v.vehicleNumber}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{v.type}</td>
                    <td className="px-6 py-4 text-gray-600">{v.capacity?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{v.driverId?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${v.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {v.isAvailable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditing(v); setModalOpen(true); }} className="text-gray-400 hover:text-primary-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(v._id)} className="text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <VehicleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        vehicle={editing}
        onSaved={fetchVehicles}
      />
    </div>
  );
}

function VehicleModal({ open, onClose, vehicle, onSaved }: { open: boolean; onClose: () => void; vehicle: Vehicle | null; onSaved: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [saving, setSaving] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      api.get('/users/delivery-partners').then(({ data }) => setPartners(data.partners || [])).catch(() => {});
      if (vehicle) {
        reset({
          vehicleNumber: vehicle.vehicleNumber,
          type: vehicle.type,
          capacity: vehicle.capacity,
          driverId: vehicle.driverId?._id || '',
          isAvailable: vehicle.isAvailable,
        });
      } else {
        reset({ vehicleNumber: '', type: 'tanker', capacity: 10000, driverId: '', isAvailable: true });
      }
    }
  }, [open, vehicle, reset]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const payload = { ...data, capacity: Number(data.capacity) };
      if (!payload.driverId) delete payload.driverId;
      if (vehicle) {
        await api.put(`/vehicles/${vehicle._id}`, payload);
        toast.success('Vehicle updated');
      } else {
        await api.post('/vehicles', payload);
        toast.success('Vehicle created');
      }
      onClose();
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={vehicle ? 'Edit Vehicle' : 'Add Vehicle'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Vehicle Number *</label>
          <input {...register('vehicleNumber', { required: 'Required' })} className="input-field" placeholder="MH-01-AB-1234" />
          {errors.vehicleNumber && <p className="text-red-500 text-xs mt-1">{String(errors.vehicleNumber.message)}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Type *</label>
            <select {...register('type')} className="input-field">
              <option value="tanker">Tanker</option>
              <option value="mini_tanker">Mini Tanker</option>
              <option value="lorry">Lorry</option>
            </select>
          </div>
          <div>
            <label className="label">Capacity (Liters) *</label>
            <input type="number" {...register('capacity', { required: 'Required', min: 1 })} className="input-field" />
          </div>
        </div>
        <div>
          <label className="label">Assign Driver</label>
          <select {...register('driverId')} className="input-field">
            <option value="">Unassigned</option>
            {partners.map((p: any) => (
              <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register('isAvailable')} id="isAvailable" className="w-4 h-4 rounded" />
          <label htmlFor="isAvailable" className="text-sm text-gray-700">Available for assignment</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
