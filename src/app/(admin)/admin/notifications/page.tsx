'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { formatDateTime, cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  orderId?: string;
  createdAt: string;
}

// Notification types that link to an order
const ORDER_TYPES = [
  'order_placed',
  'order_approved',
  'order_rejected',
  'order_assigned',
  'order_out_for_delivery',
  'order_delivered',
];

const TYPE_COLORS: Record<string, string> = {
  order_placed: 'bg-blue-100 text-blue-600',
  order_approved: 'bg-green-100 text-green-600',
  order_rejected: 'bg-red-100 text-red-600',
  order_assigned: 'bg-indigo-100 text-indigo-600',
  order_out_for_delivery: 'bg-orange-100 text-orange-600',
  order_delivered: 'bg-emerald-100 text-emerald-600',
  invoice_generated: 'bg-purple-100 text-purple-600',
  payment_received: 'bg-teal-100 text-teal-600',
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch_(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch {}
  };

  if (loading) return <LoadingSpinner />;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Notifications {unreadCount > 0 && <span className="text-base text-gray-400">({unreadCount} unread)</span>}
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You'll be notified when customers place new orders." />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const hasOrder = !!notif.orderId && ORDER_TYPES.includes(notif.type);
            const iconClass = TYPE_COLORS[notif.type] || 'bg-gray-100 text-gray-400';

            const cardContent = (
              <div
                className={cn(
                  'card p-4 flex items-start gap-3 transition-colors',
                  !notif.isRead && 'bg-primary-50/60 border-primary-200',
                  hasOrder && 'cursor-pointer hover:shadow-sm'
                )}
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif._id);
                }}
              >
                <div className={cn('mt-0.5 p-2 rounded-full flex-shrink-0', iconClass)}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm', notif.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold')}>
                      {notif.title}
                    </p>
                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-xs text-gray-400">{formatDateTime(notif.createdAt)}</p>
                    {hasOrder && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium">
                        <ExternalLink className="h-3 w-3" /> View Order
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );

            return hasOrder ? (
              <Link key={notif._id} href={`/admin/orders/${notif.orderId}`} className="block hover:no-underline">
                {cardContent}
              </Link>
            ) : (
              <div key={notif._id}>{cardContent}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
