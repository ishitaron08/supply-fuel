'use client';

import { useEffect, useState } from 'react';
import { Edit, RefreshCw } from 'lucide-react';
import Modal from '@/components/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface FuelPrice {
  _id: string;
  city: string;
  state: string;
  fuelType: string;
  basePricePerLiter: number;
  gstPercentage: number;
  effectiveDate: string;
  source: string;
  isAdminOverride: boolean;
}

export default function AdminPricingPage() {
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<FuelPrice | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/pricing');
      setPrices(data.prices || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fuel Pricing</h1>
        <button onClick={fetchPrices} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Prices are automatically fetched daily at 6 AM IST. You can override any city's price manually.
      </p>

      {prices.length === 0 ? (
        <EmptyState title="No pricing data" description="Fuel prices will be populated by the daily cron job or can be added manually." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">State</th>
                  <th className="px-5 py-3 font-medium">Fuel</th>
                  <th className="px-5 py-3 font-medium">Base Price/L</th>
                  <th className="px-5 py-3 font-medium">GST %</th>
                  <th className="px-5 py-3 font-medium">Effective Price/L</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Override</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prices.map((p) => {
                  const effectivePrice = p.basePricePerLiter * (1 + p.gstPercentage / 100);
                  return (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">{p.city}</td>
                      <td className="px-5 py-4 text-gray-600">{p.state}</td>
                      <td className="px-5 py-4 text-gray-600 capitalize">{p.fuelType}</td>
                      <td className="px-5 py-4 text-gray-900 font-medium">{formatCurrency(p.basePricePerLiter)}</td>
                      <td className="px-5 py-4 text-gray-600">{p.gstPercentage}%</td>
                      <td className="px-5 py-4 text-primary-700 font-bold">{formatCurrency(effectivePrice)}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{p.source || 'system'}</td>
                      <td className="px-5 py-4">
                        {p.isAdminOverride && <span className="badge bg-yellow-100 text-yellow-700">Yes</span>}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => { setEditingPrice(p); setEditOpen(true); }} className="text-gray-400 hover:text-primary-600">
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PriceEditModal open={editOpen} onClose={() => setEditOpen(false)} price={editingPrice} onSaved={fetchPrices} />
    </div>
  );
}

function PriceEditModal({ open, onClose, price, onSaved }: { open: boolean; onClose: () => void; price: FuelPrice | null; onSaved: () => void }) {
  const { register, handleSubmit, reset } = useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (price) {
      reset({
        basePricePerLiter: price.basePricePerLiter,
        gstPercentage: price.gstPercentage,
      });
    }
  }, [price, reset]);

  const onSubmit = async (data: any) => {
    if (!price) return;
    setSaving(true);
    try {
      await api.put(`/pricing/${price._id}`, {
        basePricePerLiter: Number(data.basePricePerLiter),
        gstPercentage: Number(data.gstPercentage),
      });
      toast.success('Price updated');
      onClose();
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit Price — ${price?.city}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Base Price per Liter (₹)</label>
          <input type="number" step="0.01" {...register('basePricePerLiter')} className="input-field" />
        </div>
        <div>
          <label className="label">GST Percentage</label>
          <input type="number" step="0.1" {...register('gstPercentage')} className="input-field" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Update Price'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
