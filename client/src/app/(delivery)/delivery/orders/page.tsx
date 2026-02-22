'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge, LoadingSpinner, EmptyState } from '@/components/ui';
import Pagination from '@/components/Pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

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
          <option value="assigned">Assigned</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState title="No deliveries found" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-5 py-3 font-medium">Order #</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Site</th>
                    <th className="px-5 py-3 font-medium">Qty</th>
                    <th className="px-5 py-3 font-medium">Delivery Date</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order: any) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <Link href={`/delivery/orders/${order._id}`} className="text-primary-600 hover:underline font-medium">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{order.customerId?.name || '—'}</td>
                      <td className="px-5 py-4 text-gray-600">{order.deliverySiteId?.siteName || '—'}</td>
                      <td className="px-5 py-4 text-gray-600">{order.quantityLiters}L</td>
                      <td className="px-5 py-4 text-gray-600">{formatDate(order.requestedDeliveryDate)}</td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
