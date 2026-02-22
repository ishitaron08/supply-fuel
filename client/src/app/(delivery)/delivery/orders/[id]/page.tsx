'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Truck, Phone, Navigation } from 'lucide-react';
import { StatusBadge, LoadingSpinner } from '@/components/ui';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function DeliveryOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const fetchOrder = () => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch(() => router.push('/delivery/orders')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const updateStatus = async (status: string) => {
    const labels: Record<string, string> = {
      out_for_delivery: 'Mark as Out for Delivery',
      delivered: 'Mark as Delivered',
    };
    if (!confirm(`${labels[status] || 'Update status'}?`)) return;
    setActing(true);
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success('Status updated');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return null;

  const site = order.deliverySiteId;
  const customer = order.customerId;

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {order.status === 'assigned' && (
          <button onClick={() => updateStatus('out_for_delivery')} disabled={acting} className="btn-primary flex items-center gap-2">
            <Truck className="h-4 w-4" /> Start Delivery
          </button>
        )}
        {order.status === 'out_for_delivery' && (
          <button onClick={() => updateStatus('delivered')} disabled={acting} className="btn-success flex items-center gap-2">
            <Truck className="h-4 w-4" /> Mark Delivered
          </button>
        )}
      </div>

      {/* Delivery Site with navigation */}
      {site && (
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Delivery Site</h2>
            </div>
            {site.geoLocation?.lat && (
              <a
                href={`https://maps.google.com/?q=${site.geoLocation.lat},${site.geoLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-1 text-sm"
              >
                <Navigation className="h-4 w-4" /> Navigate
              </a>
            )}
          </div>
          <p className="text-sm font-medium">{site.siteName}</p>
          <p className="text-sm text-gray-600">{site.address}, {site.city}, {site.state} — {site.pincode}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600 pt-1">
            <span className="font-medium">{site.contactPerson}</span>
            {site.contactPhone && (
              <a href={`tel:${site.contactPhone}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                <Phone className="h-4 w-4" /> {site.contactPhone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Customer Info */}
      {customer && (
        <div className="card p-6 space-y-2">
          <h2 className="font-semibold text-gray-900">Customer</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Name</p><p className="font-medium">{customer.name}</p></div>
            <div><p className="text-gray-500">Phone</p>
              <p className="font-medium">
                {customer.phone ? (
                  <a href={`tel:${customer.phone}`} className="text-primary-600 hover:underline">{customer.phone}</a>
                ) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Order Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div><p className="text-gray-500">Fuel Type</p><p className="font-medium capitalize">{order.fuelType}</p></div>
          <div><p className="text-gray-500">Quantity</p><p className="font-medium">{order.quantityLiters?.toLocaleString()} L</p></div>
          <div><p className="text-gray-500">Total Amount</p><p className="font-bold text-primary-700">{formatCurrency(order.totalAmount)}</p></div>
          <div><p className="text-gray-500">Payment Mode</p><p className="font-medium capitalize">{order.paymentMode}</p></div>
          <div><p className="text-gray-500">Requested Date</p><p className="font-medium">{formatDate(order.requestedDeliveryDate)}</p></div>
          {order.deliveredAt && <div><p className="text-gray-500">Delivered At</p><p className="font-medium">{formatDateTime(order.deliveredAt)}</p></div>}
        </div>
      </div>

      {/* Vehicle Info */}
      {order.assignedVehicleId && (
        <div className="card p-6 space-y-2">
          <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary-600" /><h2 className="font-semibold text-gray-900">Assigned Vehicle</h2></div>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">Number:</span> {order.assignedVehicleId.vehicleNumber}</p>
            <p><span className="text-gray-500">Type:</span> <span className="capitalize">{order.assignedVehicleId.type}</span></p>
            <p><span className="text-gray-500">Capacity:</span> {order.assignedVehicleId.capacity?.toLocaleString()} L</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Customer Notes</h2>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
