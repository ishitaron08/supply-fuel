'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Users, Truck, DollarSign, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { StatCard, LoadingSpinner } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/orders/stats');
        setStats(data.stats);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Delivered Orders"
          value={stats?.deliveredOrders ?? 0}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          icon={<DollarSign className="h-6 w-6" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Approved"
          value={stats?.approvedOrders ?? 0}
          icon={<CheckCircle className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Rejected"
          value={stats?.rejectedOrders ?? 0}
          icon={<XCircle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Assigned"
          value={stats?.assignedOrders ?? 0}
          icon={<Truck className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Out for Delivery"
          value={stats?.outForDeliveryOrders ?? 0}
          icon={<Package className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Recent pending orders summary */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="/admin/orders?status=pending" className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors text-center">
            <p className="text-2xl font-bold text-yellow-700">{stats?.pendingOrders ?? 0}</p>
            <p className="text-sm text-yellow-600 mt-1">Orders awaiting approval</p>
          </a>
          <a href="/admin/orders?status=approved" className="p-4 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-center">
            <p className="text-2xl font-bold text-blue-700">{stats?.approvedOrders ?? 0}</p>
            <p className="text-sm text-blue-600 mt-1">Orders need assignment</p>
          </a>
          <a href="/admin/orders?status=out_for_delivery" className="p-4 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors text-center">
            <p className="text-2xl font-bold text-purple-700">{stats?.outForDeliveryOrders ?? 0}</p>
            <p className="text-sm text-purple-600 mt-1">Currently out for delivery</p>
          </a>
        </div>
      </div>
    </div>
  );
}
