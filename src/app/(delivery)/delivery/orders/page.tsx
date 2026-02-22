'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, CheckCircle, MapPin, Navigation } from 'lucide-react';
import { StatusBadge, LoadingSpinner, EmptyState } from '@/components/ui';
import Pagination from '@/components/Pagination';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function mapsUrl(site: any) {
  if (site?.geoLocation?.lat) return `https://maps.google.com/?q=${site.geoLocation.lat},${site.geoLocation.lng}`;
  const addr = [site?.address, site?.city, site?.state, site?.pincode].filter(Boolean).join(', ');
  return `https://maps.google.com/?q=${encodeURIComponent(addr)}`;
}

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const updateStatus = async (orderId: string, status: string) => {
    setActing(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(status === 'out_for_delivery' ? 'Delivery started!' : 'Marked as delivered!');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">All Statuses</option>
          <option value="assigned">To Pick Up</option>
          <option value="out_for_delivery">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState title="No deliveries found" />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order: any) => {
              const site = order.deliverySiteId;
              const isActive = order.status === 'assigned' || order.status === 'out_for_delivery';
              return (
                <div key={order._id}
                  className={`card p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                    order.status === 'assigned' ? 'border-l-4 border-l-blue-400' :
                    order.status === 'out_for_delivery' ? 'border-l-4 border-l-yellow-400' : ''
                  }`}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/delivery/orders/${order._id}`} className="font-bold text-primary-600 hover:underline">
                        {order.orderNumber}
                      </Link>
                      <StatusBadge status={order.status} />
                      <span className="text-xs text-gray-500">{order.fuelType?.toUpperCase()} · {order.quantityLiters?.toLocaleString()} L</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{order.customerId?.name || '—'}</p>
                    {site && (
                      <div className="flex items-start gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{site.address}, {site.city}, {site.state} — {site.pincode}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      Delivery date: <span className="font-medium text-gray-600">{formatDate(order.requestedDeliveryDate)}</span>
                      {site?.contactPerson && <> &nbsp;·&nbsp; Contact: <span className="font-medium text-gray-600">{site.contactPerson} {site.contactPhone && `(${site.contactPhone})`}</span></>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {site && (
                      <a href={mapsUrl(site)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors">
                        <Navigation className="h-3.5 w-3.5" /> Navigate
                      </a>
                    )}
                    {order.status === 'assigned' && (
                      <button
                        onClick={() => updateStatus(order._id, 'out_for_delivery')}
                        disabled={!!acting}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <Truck className="h-3.5 w-3.5" />{acting === order._id ? '…' : 'Start Delivery'}
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => updateStatus(order._id, 'delivered')}
                        disabled={!!acting}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />{acting === order._id ? '…' : 'Mark Delivered'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
