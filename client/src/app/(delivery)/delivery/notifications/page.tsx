'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
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
  createdAt: string;
}

export default function DeliveryNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch {} finally { setLoading(false); }
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
        <EmptyState title="No notifications" />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && markAsRead(notif._id)}
              className={cn('card p-4 flex items-start gap-3 cursor-pointer transition-colors', !notif.isRead && 'bg-primary-50/50 border-primary-200')}
            >
              <div className={cn('mt-0.5 p-2 rounded-full flex-shrink-0', notif.isRead ? 'bg-gray-100 text-gray-400' : 'bg-primary-100 text-primary-600')}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', notif.isRead ? 'text-gray-600' : 'text-gray-900 font-medium')}>{notif.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.createdAt)}</p>
              </div>
              {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
