'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, MapPin, Fuel, Clock, TrendingUp, Plus, Building2, User as UserIcon } from 'lucide-react';
import { StatCard, LoadingSpinner } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function CustomerDashboard() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isOrg = user?.profileType === 'organization';
  const isIndividual = user?.profileType === 'individual';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes] = await Promise.all([
          api.get('/orders?limit=5&sortBy=createdAt&sortOrder=desc'),
        ]);
        setRecentOrders(ordersRes.data.data || []);

        // Derive stats from orders
        const orders = ordersRes.data.data || [];
        const total = ordersRes.data.pagination?.total || orders.length;
        const pending = orders.filter((o: any) => o.status === 'pending').length;
        const delivered = orders.filter((o: any) => o.status === 'delivered').length;

        setStats({ total, pending, delivered });
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className={`rounded-xl p-5 ${isOrg ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200' : 'bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200'}`}>
        <div className="flex items-center gap-3 mb-1">
          {isOrg ? <Building2 className="h-6 w-6 text-orange-600" /> : <UserIcon className="h-6 w-6 text-primary-600" />}
          <h1 className="text-2xl font-bold text-gray-900">
            {isOrg ? `Welcome, ${user?.organizationName || user?.name}` : `Hi, ${user?.name}`}
          </h1>
        </div>
        <p className="text-sm text-gray-600 ml-9">
          {isOrg
            ? 'Manage your organization\'s fuel orders, delivery sites, and billing from one place.'
            : 'Order fuel for personal use quickly and conveniently.'}
        </p>
      </div>

      <div className="flex items-center justify-end">
        <Link href="/dashboard/order/new" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Order Fuel
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Orders"
          value={stats?.total ?? 0}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Pending"
          value={stats?.pending ?? 0}
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Delivered"
          value={stats?.delivered ?? 0}
          icon={<TrendingUp className="h-6 w-6" />}
          color="green"
        />
      </div>

      {/* Quick actions — different for org vs individual */}
      <div className={`grid grid-cols-1 ${isOrg ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
        <Link href="/dashboard/order/new" className="card p-6 flex items-center gap-4 hover:border-primary-300 transition-colors">
          <div className="p-3 rounded-xl bg-fuel-orange/10 text-fuel-orange">
            <Fuel className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Place New Order</p>
            <p className="text-sm text-gray-500">
              {isOrg ? 'Bulk diesel for your delivery sites' : 'Order diesel delivered to your address'}
            </p>
          </div>
        </Link>

        {isOrg && (
          <Link href="/dashboard/sites" className="card p-6 flex items-center gap-4 hover:border-primary-300 transition-colors">
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Manage Sites</p>
              <p className="text-sm text-gray-500">Add or edit your delivery sites</p>
            </div>
          </Link>
        )}

        <Link href="/dashboard/orders" className="card p-6 flex items-center gap-4 hover:border-primary-300 transition-colors">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">View All Orders</p>
            <p className="text-sm text-gray-500">Track and manage your fuel orders</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-primary-600 hover:text-primary-700">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            {isOrg
              ? 'No orders yet. Set up a delivery site and place your first bulk order!'
              : 'No orders yet. Place your first fuel order above!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-6 py-3 font-medium">Order #</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Quantity</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/orders/${order._id}`} className="text-primary-600 hover:underline font-medium">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 text-gray-600">{order.quantityLiters}L</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
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
