'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fuel, MapPin, Calculator, CreditCard, CheckCircle, ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface Site {
  _id: string;
  siteName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isOrg = user?.profileType === 'organization';

  const orgSteps = [
    { icon: MapPin, label: 'Select Site' },
    { icon: Fuel, label: 'Fuel Details' },
    { icon: Calculator, label: 'Review Price' },
    { icon: CreditCard, label: 'Payment' },
    { icon: CheckCircle, label: 'Confirm' },
  ];

  const individualSteps = [
    { icon: Home, label: 'Delivery Address' },
    { icon: Fuel, label: 'Fuel Details' },
    { icon: Calculator, label: 'Review Price' },
    { icon: CreditCard, label: 'Payment' },
    { icon: CheckCircle, label: 'Confirm' },
  ];

  const steps = isOrg ? orgSteps : individualSteps;

  const MIN_QTY = 500;
  const MAX_QTY = isOrg ? 50000 : 5000;
  const DEFAULT_QTY = isOrg ? 1000 : 500;

  const [step, setStep] = useState(0);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [fuelType, setFuelType] = useState('diesel');
  const [quantity, setQuantity] = useState<number>(DEFAULT_QTY);
  const [requestedDate, setRequestedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [pricing, setPricing] = useState<any>(null);
  const paymentMode = 'cod';
  const [submitting, setSubmitting] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Individual user delivery address fields
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryCity, setDeliveryCity] = useState(user?.city || '');
  const [deliveryState, setDeliveryState] = useState(user?.state || '');
  const [deliveryPincode, setDeliveryPincode] = useState('');

  // Fetch sites on mount (only for org users)
  useEffect(() => {
    if (isOrg) {
      api.get('/sites').then(({ data }) => setSites(data.data || [])).catch(() => {});
    }
  }, [isOrg]);

  // Fetch pricing when entering step 2
  const fetchPrice = async () => {
    const city = isOrg ? selectedSite?.city : deliveryCity;
    if (!city) return;
    setLoadingPrice(true);
    try {
      const { data } = await api.get(`/pricing?city=${encodeURIComponent(city)}&fuelType=${fuelType}`);
      const base = data.data?.pricePerLiter || 89.62;
      const gstPct = data.data?.gstPercentage || 18;
      const subtotal = base * quantity;
      const gstAmount = subtotal * (gstPct / 100);
      const total = subtotal + gstAmount;
      setPricing({ basePricePerLiter: base, gstPercentage: gstPct, subtotal, gstAmount, total });
    } catch {
      // Use defaults
      const base = 89.62;
      const gstPct = 18;
      const subtotal = base * quantity;
      const gstAmount = subtotal * (gstPct / 100);
      const total = subtotal + gstAmount;
      setPricing({ basePricePerLiter: base, gstPercentage: gstPct, subtotal, gstAmount, total });
    } finally {
      setLoadingPrice(false);
    }
  };

  const canContinue = () => {
    if (step === 0) {
      if (isOrg) return !!selectedSite;
      return deliveryAddress.trim() && deliveryCity.trim() && deliveryState.trim() && deliveryPincode.trim();
    }
    if (step === 1) return quantity >= MIN_QTY && quantity <= MAX_QTY && requestedDate;
    return true;
  };

  const handleNext = async () => {
    if (step === 1) {
      await fetchPrice();
    }
    if (step === 4) {
      return handleSubmit();
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleSubmit = async () => {
    if (isOrg && !selectedSite) return;
    if (!pricing) return;
    setSubmitting(true);
    try {
      const payload: any = {
        fuelType,
        quantityLiters: quantity,
        requestedDeliveryDate: requestedDate,
        paymentMode,
        notes,
      };

      if (isOrg) {
        payload.deliverySiteId = selectedSite!._id;
      } else {
        // For individual users, auto-create a delivery site first
        const sitePayload = {
          siteName: `${user?.name || 'My'} - Delivery Address`,
          address: deliveryAddress,
          city: deliveryCity,
          state: deliveryState,
          pincode: deliveryPincode,
          contactPerson: user?.name || '',
          contactPhone: user?.phone || '',
        };
        const siteRes = await api.post('/sites', sitePayload);
        payload.deliverySiteId = siteRes.data.data._id;
      }

      const { data } = await api.post('/orders', payload);
      toast.success('Order placed successfully!');
      router.push(`/dashboard/orders/${data.data._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {isOrg ? 'Place Bulk Order' : 'Order Fuel'}
      </h1>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className={cn(
              'flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 transition-colors',
              i <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
            )}>
              <s.icon className="h-4 w-4" />
            </div>
            <span className={cn('text-xs hidden sm:block', i <= step ? 'text-primary-700 font-medium' : 'text-gray-400')}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2', i < step ? 'bg-primary-600' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 0: Select Site (Org) or Enter Address (Individual) */}
        {step === 0 && isOrg && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Delivery Site</h2>
            {sites.length === 0 ? (
              <p className="text-gray-500">No sites found. <a href="/dashboard/sites" className="text-primary-600 underline">Add a site first</a>.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {sites.map((site) => (
                  <button
                    key={site._id}
                    type="button"
                    onClick={() => setSelectedSite(site)}
                    className={cn(
                      'text-left p-4 border rounded-lg transition-colors',
                      selectedSite?._id === site._id
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <p className="font-medium text-gray-900">{site.siteName}</p>
                    <p className="text-sm text-gray-500">{site.address}, {site.city}, {site.state} — {site.pincode}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 0 && !isOrg && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Delivery Address</h2>
            <p className="text-sm text-gray-500">Enter the address where you want the fuel delivered.</p>
            <div>
              <label className="label">Address *</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="input-field"
                placeholder="Street address, building, area"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City *</label>
                <input
                  type="text"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div>
                <label className="label">State *</label>
                <input
                  type="text"
                  value={deliveryState}
                  onChange={(e) => setDeliveryState(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Maharashtra"
                />
              </div>
            </div>
            <div className="w-1/2">
              <label className="label">Pincode *</label>
              <input
                type="text"
                value={deliveryPincode}
                onChange={(e) => setDeliveryPincode(e.target.value)}
                className="input-field"
                placeholder="e.g. 400001"
                maxLength={6}
              />
            </div>
          </div>
        )}

        {/* Step 1: Fuel details */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Fuel Details</h2>
            <div>
              <label className="label">Fuel Type</label>
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="input-field">
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="cng">CNG</option>
                <option value="lpg">LPG</option>
              </select>
            </div>
            <div>
              <label className="label">Quantity (Liters) — min {MIN_QTY.toLocaleString()}, max {MAX_QTY.toLocaleString()}</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={MIN_QTY}
                max={MAX_QTY}
                className="input-field"
              />
              {(quantity < MIN_QTY || quantity > MAX_QTY) && (
                <p className="text-red-500 text-xs mt-1">Quantity must be between {MIN_QTY.toLocaleString()} and {MAX_QTY.toLocaleString()} liters</p>
              )}
              {!isOrg && (
                <div className="mt-2 flex gap-2">
                  {[500, 1000, 2000, 5000].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                        quantity === q ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      )}
                    >
                      {q}L
                    </button>
                  ))}
                </div>
              )}
              {isOrg && (
                <div className="mt-2 flex gap-2">
                  {[1000, 2000, 5000, 10000].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                        quantity === q ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      )}
                    >
                      {q.toLocaleString()}L
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="label">Requested Delivery Date *</label>
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={minDate}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input-field" placeholder={isOrg ? 'Any special delivery instructions for the site...' : 'Any special instructions (gate code, parking, etc.)'} />
            </div>
          </div>
        )}

        {/* Step 2: Review price */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Price Summary</h2>
            {loadingPrice ? (
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : pricing ? (
              <div className="bg-gray-50 rounded-lg p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fuel Type</span>
                  <span className="font-medium capitalize">{fuelType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-medium">{quantity.toLocaleString()} L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per Liter</span>
                  <span className="font-medium">{formatCurrency(pricing.basePricePerLiter)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST ({pricing.gstPercentage}%)</span>
                  <span className="font-medium">{formatCurrency(pricing.gstAmount)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-base font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary-700">{formatCurrency(pricing.total)}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Payment Method</h2>
            <div className="text-left p-4 border rounded-lg border-primary-500 bg-primary-50 ring-1 ring-primary-500">
              <p className="font-medium text-gray-900">Cash on Delivery</p>
              <p className="text-sm text-gray-500">Payment is collected at delivery confirmation.</p>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Confirm Your Order</h2>
            <div className="bg-gray-50 rounded-lg p-5 space-y-4 text-sm">
              <div>
                <p className="text-gray-500">{isOrg ? 'Delivery Site' : 'Delivery Address'}</p>
                {isOrg ? (
                  <>
                    <p className="font-medium">{selectedSite?.siteName}</p>
                    <p className="text-gray-500">{selectedSite?.address}, {selectedSite?.city}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">{deliveryAddress}</p>
                    <p className="text-gray-500">{deliveryCity}, {deliveryState} — {deliveryPincode}</p>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Fuel Type</p>
                  <p className="font-medium capitalize">{fuelType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Quantity</p>
                  <p className="font-medium">{quantity.toLocaleString()} L</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Delivery Date</p>
                  <p className="font-medium">{requestedDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment</p>
                  <p className="font-medium">Cash on Delivery</p>
                </div>
              </div>
              <hr />
              <div className="flex justify-between text-base font-bold">
                <span>Total Amount</span>
                <span className="text-primary-700">{pricing && formatCurrency(pricing.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canContinue() || submitting}
            className="btn-primary flex items-center gap-1"
          >
            {step === 4 ? (submitting ? 'Placing Order...' : 'Place Order') : 'Continue'}
            {step < 4 && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
