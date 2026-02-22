'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StatusBadge, LoadingSpinner, EmptyState } from '@/components/ui';
import Pagination from '@/components/Pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="assigned">Assigned</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #..."
            className="input-field w-auto"
          />
          <button type="submit" className="btn-secondary text-sm">Search</button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order #</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Site</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order: any) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order._id}`} className="text-primary-600 hover:underline font-medium">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.customerId?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{order.deliverySiteId?.siteName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-600">{order.quantityLiters}L</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 capitalize text-gray-600">{order.paymentStatus}</td>
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
