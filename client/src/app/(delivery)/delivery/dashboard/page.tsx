'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, Clock, CheckCircle, Package } from 'lucide-react';
import { StatCard, LoadingSpinner, StatusBadge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders?limit=10&sortBy=createdAt&sortOrder=desc')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const assigned = orders.filter((o) => o.status === 'assigned').length;
  const outForDelivery = orders.filter((o) => o.status === 'out_for_delivery').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const total = orders.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assigned" value={total} icon={<Truck className="h-6 w-6" />} color="primary" />
        <StatCard title="To Pick Up" value={assigned} icon={<Clock className="h-6 w-6" />} color="yellow" />
        <StatCard title="In Transit" value={outForDelivery} icon={<Package className="h-6 w-6" />} color="purple" />
        <StatCard title="Delivered" value={delivered} icon={<CheckCircle className="h-6 w-6" />} color="green" />
      </div>

      {/* Active deliveries */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Deliveries</h2>
          <Link href="/delivery/orders" className="text-sm text-primary-600 hover:text-primary-700">View all →</Link>
        </div>
        {orders.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">No deliveries assigned yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-6 py-3 font-medium">Order #</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Site</th>
                  <th className="px-6 py-3 font-medium">Qty</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Delivery Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.slice(0, 5).map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/delivery/orders/${order._id}`} className="text-primary-600 hover:underline font-medium">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.customerId?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{order.deliverySiteId?.siteName || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{order.quantityLiters}L</td>
                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(order.requestedDeliveryDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
