'use client';

import { useEffect, useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const user = useAuthStore((s) => s.user);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications?limit=1');
        setUnreadCount(data.unreadCount || 0);
      } catch {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const notifHref =
    user?.role === 'admin'
      ? '/admin/notifications'
      : user?.role === 'delivery_partner'
        ? '/delivery/notifications'
        : '/dashboard/notifications';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden text-gray-600">
            <Menu className="h-6 w-6" />
          </button>
          {title && <h1 className="text-lg font-semibold text-gray-900">{title}</h1>}
        </div>

        <div className="flex items-center gap-4">
          <Link href={notifHref} className="relative text-gray-500 hover:text-gray-700">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-gray-600">{user?.name}</span>
            {user?.role === 'customer' && user?.profileType && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                user.profileType === 'organization'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {user.profileType === 'organization' ? 'ORG' : 'INDIVIDUAL'}
              </span>
            )}
            {user?.role !== 'customer' && (
              <span className="text-gray-400">({user?.role?.replace('_', ' ')})</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
