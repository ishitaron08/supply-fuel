'use client';

import { useEffect, useState } from 'react';
import { Edit, RefreshCw, Plus, AlertCircle, Database, Trash2 } from 'lucide-react';
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
  lastUpdatedAt: string;
}

const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel', color: 'bg-blue-100 text-blue-700' },
  { value: 'petrol', label: 'Petrol', color: 'bg-green-100 text-green-700' },
  { value: 'cng', label: 'CNG', color: 'bg-orange-100 text-orange-700' },
  { value: 'lpg', label: 'LPG', color: 'bg-purple-100 text-purple-700' },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana',
  'Uttar Pradesh','Uttarakhand','West Bengal',
];

function getFuelBadge(fuelType: string) {
  const ft = FUEL_TYPES.find((f) => f.value === fuelType);
  return ft ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ft.color}`}>
      {ft.label}
    </span>
  ) : (
    <span className="badge bg-gray-100 text-gray-600 capitalize">{fuelType}</span>
  );
}

const SOURCE_CONFIG: Record<string, { label: string; cls: string }> = {
  admin:          { label: 'Admin',      cls: 'bg-indigo-100 text-indigo-700' },
  admin_override: { label: 'Admin',      cls: 'bg-indigo-100 text-indigo-700' },
  manual:         { label: 'Manual',     cls: 'bg-teal-100 text-teal-700' },
  cron:           { label: 'Daily Cron', cls: 'bg-sky-100 text-sky-700' },
  fallback:       { label: 'Daily Cron', cls: 'bg-sky-100 text-sky-700' },
};

function getSourceBadge(source: string) {
  const cfg = SOURCE_CONFIG[source] ?? { label: source || 'System', cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function AdminPricingPage() {
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<FuelPrice | null>(null);
  const [filterFuel, setFilterFuel] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const fetchPrices = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data } = await api.get('/pricing/all');
      setPrices(data.data || []);
    } catch (err: any) {
      setFetchError(err.response?.data?.message || 'Unable to load pricing data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  const seedDefaults = async () => {
    if (!confirm('This will populate/refresh diesel prices for 20 major Indian cities. Continue?')) return;
    try {
      toast.loading('Seeding city prices…', { id: 'seed' });
      await api.get('/cron/fuel-prices');
      toast.success('City prices seeded successfully', { id: 'seed' });
      fetchPrices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Seeding failed', { id: 'seed' });
    }
  };

  const deletePrice = async (price: FuelPrice) => {
    if (!confirm(`Delete price for ${price.city} (${price.fuelType.toUpperCase()})? This cannot be undone.`)) return;
    try {
      await api.delete(`/pricing/${price._id}`);
      toast.success(`Deleted ${price.city} ${price.fuelType.toUpperCase()}`);
      fetchPrices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete price');
    }
  };

  const availableStates = [...new Set(prices.map((p) => p.state))].sort();

  const filtered = prices
    .filter((p) => !filterFuel  || p.fuelType === filterFuel)
    .filter((p) => !stateFilter || p.state === stateFilter)
    .filter((p) => !citySearch  || p.city.toLowerCase().includes(citySearch.toLowerCase()));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fuel Pricing</h1>
        <div className="flex items-center gap-3">
          <button onClick={fetchPrices} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={seedDefaults} className="btn-secondary flex items-center gap-2 text-sm text-sky-700 border-sky-300 hover:bg-sky-50">
            <Database className="h-4 w-4" /> Sync Daily Prices
          </button>
          <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> Add Price
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Prices are automatically fetched daily at 6 AM IST. You can add or override any city's price manually.
      </p>

      {/* Error banner */}
      {fetchError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Failed to load pricing data</p>
            <p className="mt-0.5 text-red-600">{fetchError}</p>
          </div>
          <button onClick={fetchPrices} className="btn-secondary text-xs px-3 py-1.5">
            Retry
          </button>
        </div>
      )}

      {/* Search + state filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search city..."
          value={citySearch}
          onChange={(e) => setCitySearch(e.target.value)}
          className="input-field w-auto"
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All States</option>
          {availableStates.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(stateFilter || citySearch || filterFuel) && (
          <button
            onClick={() => { setStateFilter(''); setCitySearch(''); setFilterFuel(''); }}
            className="text-xs text-gray-500 hover:text-red-500 underline px-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Fuel type filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterFuel('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filterFuel === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({prices.length})
        </button>
        {FUEL_TYPES.map((ft) => {
          const count = prices.filter((p) => p.fuelType === ft.value).length;
          return (
            <button
              key={ft.value}
              onClick={() => setFilterFuel(ft.value === filterFuel ? '' : ft.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterFuel === ft.value ? `${ft.color} ring-1 ring-offset-1 ring-current` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {ft.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No pricing data"
          description={
            filterFuel
              ? `No ${FUEL_TYPES.find((f) => f.value === filterFuel)?.label} prices added yet. Click "Add Price" to add one.`
              : 'No fuel prices found. Click "Add Price" to create the first entry.'
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
            Showing {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">State</th>
                  <th className="px-5 py-3 font-medium">Fuel Type</th>
                  <th className="px-5 py-3 font-medium">Base Price/L</th>
                  <th className="px-5 py-3 font-medium">GST %</th>
                  <th className="px-5 py-3 font-medium">Effective Price/L</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Override</th>
                  <th className="px-5 py-3 font-medium">Last Updated</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((p) => {
                  const effectivePrice = p.basePricePerLiter * (1 + p.gstPercentage / 100);
                  return (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">{p.city}</td>
                      <td className="px-5 py-4 text-gray-600">{p.state}</td>
                      <td className="px-5 py-4">{getFuelBadge(p.fuelType)}</td>
                      <td className="px-5 py-4 text-gray-900 font-medium">{formatCurrency(p.basePricePerLiter)}</td>
                      <td className="px-5 py-4 text-gray-600">{p.gstPercentage}%</td>
                      <td className="px-5 py-4 text-primary-700 font-bold">{formatCurrency(effectivePrice)}</td>
                      <td className="px-5 py-4">
                        {getSourceBadge(p.source)}
                      </td>
                      <td className="px-5 py-4">
                        {p.isAdminOverride ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {p.lastUpdatedAt ? new Date(p.lastUpdatedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingPrice(p); setEditOpen(true); }}
                            className="text-gray-400 hover:text-primary-600 transition-colors"
                            title="Edit price"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deletePrice(p)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete price"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddPriceModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={fetchPrices} />
      <PriceEditModal open={editOpen} onClose={() => setEditOpen(false)} price={editingPrice} onSaved={fetchPrices} />
    </div>
  );
}

// ─── Add Price Modal ────────────────────────────────────────────────────────

function AddPriceModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [saving, setSaving] = useState(false);

  const onSubmit = async (formData: any) => {
    setSaving(true);
    try {
      await api.post('/pricing', {
        city: formData.city,
        state: formData.state,
        fuelType: formData.fuelType,
        basePricePerLiter: Number(formData.basePricePerLiter),
        gstPercentage: Number(formData.gstPercentage),
      });
      toast.success('Fuel price added successfully');
      reset();
      onClose();
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Fuel Price">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">City *</label>
            <input
              type="text"
              placeholder="e.g. Mumbai"
              {...register('city', { required: 'City is required' })}
              className="input-field"
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{String(errors.city.message)}</p>}
          </div>
          <div>
            <label className="label">State *</label>
            <select {...register('state', { required: 'State is required' })} className="input-field">
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.state && <p className="text-xs text-red-500 mt-1">{String(errors.state.message)}</p>}
          </div>
        </div>

        <div>
          <label className="label">Fuel Type *</label>
          <div className="grid grid-cols-4 gap-2">
            {FUEL_TYPES.map((ft) => (
              <label key={ft.value} className="relative cursor-pointer">
                <input
                  type="radio"
                  value={ft.value}
                  {...register('fuelType', { required: 'Fuel type is required' })}
                  className="sr-only peer"
                />
                <div className={`text-center px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all peer-checked:border-primary-500 peer-checked:${ft.color} border-gray-200 hover:border-gray-300`}>
                  {ft.label}
                </div>
              </label>
            ))}
          </div>
          {errors.fuelType && <p className="text-xs text-red-500 mt-1">{String(errors.fuelType.message)}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Base Price per Liter (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 89.62"
              {...register('basePricePerLiter', { required: 'Price is required', min: { value: 0.01, message: 'Must be positive' } })}
              className="input-field"
            />
            {errors.basePricePerLiter && <p className="text-xs text-red-500 mt-1">{String(errors.basePricePerLiter.message)}</p>}
          </div>
          <div>
            <label className="label">GST % (default 18)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="18"
              {...register('gstPercentage')}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => { reset(); onClose(); }} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Adding...' : 'Add Price'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Edit Price Modal ───────────────────────────────────────────────────────

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
      toast.success('Price updated successfully');
      onClose();
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit Price — ${price?.city} (${price?.fuelType?.toUpperCase()})`}>
      <div className="mb-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-900">{price?.city}, {price?.state}</p>
          <p className="text-xs text-gray-500">
            {price && getFuelBadge(price.fuelType)}
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Base Price per Liter (₹)</label>
          <input type="number" step="0.01" min="0" {...register('basePricePerLiter')} className="input-field" />
        </div>
        <div>
          <label className="label">GST Percentage (%)</label>
          <input type="number" step="0.1" min="0" max="100" {...register('gstPercentage')} className="input-field" />
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
          ⚠ This will mark the price as an admin override and update the effective date.
        </p>
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
