'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, Clock, CheckCircle, Package, MapPin, Phone, CalendarClock, Navigation } from 'lucide-react';
import { StatCard, LoadingSpinner, StatusBadge } from '@/components/ui';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function mapsUrl(site: any) {
  if (site?.geoLocation?.lat) {
    return `https://maps.google.com/?q=${site.geoLocation.lat},${site.geoLocation.lng}`;
  }
  const addr = [site?.address, site?.city, site?.state, site?.pincode].filter(Boolean).join(', ');
  return `https://maps.google.com/?q=${encodeURIComponent(addr)}`;
}

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchOrders = () => {
    api.get('/orders?limit=100')
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setActing(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(status === 'out_for_delivery' ? 'Delivery started!' : 'Order marked as delivered!');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActing(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const today = new Date().toDateString();
  const activeOrders = orders.filter((o) => o.status === 'assigned' || o.status === 'out_for_delivery');
  const todayOrders = orders.filter((o) => new Date(o.requestedDeliveryDate).toDateString() === today);
  const assigned = orders.filter((o) => o.status === 'assigned').length;
  const outForDelivery = orders.filter((o) => o.status === 'out_for_delivery').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const total = orders.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
        <Link href="/delivery/orders" className="btn-secondary text-sm">All Deliveries →</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={total} icon={<Truck className="h-6 w-6" />} color="primary" />
        <StatCard title="To Pick Up" value={assigned} icon={<Clock className="h-6 w-6" />} color="yellow" />
        <StatCard title="In Transit" value={outForDelivery} icon={<Package className="h-6 w-6" />} color="purple" />
        <StatCard title="Delivered" value={delivered} icon={<CheckCircle className="h-6 w-6" />} color="green" />
      </div>

      {/* Today's deliveries */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">Today's Deliveries</h2>
          <span className="ml-auto text-xs font-medium text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        {todayOrders.length === 0 ? (
          <div className="px-6 py-6 text-center text-gray-400 text-sm">No deliveries scheduled for today.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todayOrders.map((order: any) => {
              const site = order.deliverySiteId;
              return (
                <div key={order._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/delivery/orders/${order._id}`} className="font-semibold text-primary-600 hover:underline">{order.orderNumber}</Link>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm font-medium text-gray-800">{order.customerId?.name || '—'}</p>
                    {site && (
                      <div className="flex items-start gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{site.address}, {site.city}, {site.state} — {site.pincode}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{order.quantityLiters?.toLocaleString()} L · {order.fuelType?.toUpperCase()}</span>
                      {site?.contactPhone && (
                        <a href={`tel:${site.contactPhone}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {site.contactPhone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={mapsUrl(site)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors">
                      <Navigation className="h-3.5 w-3.5" /> Navigate
                    </a>
                    {order.status === 'assigned' && (
                      <button onClick={() => updateStatus(order._id, 'out_for_delivery')} disabled={!!acting}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        <Truck className="h-3.5 w-3.5" /> {acting === order._id ? '…' : 'Start'}
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button onClick={() => updateStatus(order._id, 'delivered')} disabled={!!acting}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                        <CheckCircle className="h-3.5 w-3.5" /> {acting === order._id ? '…' : 'Delivered'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active deliveries (not today) */}
      {activeOrders.filter((o) => new Date(o.requestedDeliveryDate).toDateString() !== today).length > 0 && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Other Active Deliveries</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activeOrders
              .filter((o) => new Date(o.requestedDeliveryDate).toDateString() !== today)
              .map((order: any) => {
                const site = order.deliverySiteId;
                return (
                  <div key={order._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/delivery/orders/${order._id}`} className="font-semibold text-primary-600 hover:underline">{order.orderNumber}</Link>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-800">{order.customerId?.name || '—'}</p>
                      {site && (
                        <div className="flex items-start gap-1 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>{site.address}, {site.city}, {site.state} — {site.pincode}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">Delivery date: {formatDate(order.requestedDeliveryDate)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={mapsUrl(site)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200">
                        <Navigation className="h-3.5 w-3.5" /> Navigate
                      </a>
                      {order.status === 'assigned' && (
                        <button onClick={() => updateStatus(order._id, 'out_for_delivery')} disabled={!!acting}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                          <Truck className="h-3.5 w-3.5" /> {acting === order._id ? '…' : 'Start'}
                        </button>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <button onClick={() => updateStatus(order._id, 'delivered')} disabled={!!acting}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                          <CheckCircle className="h-3.5 w-3.5" /> {acting === order._id ? '…' : 'Delivered'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
