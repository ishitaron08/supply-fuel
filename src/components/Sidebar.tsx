'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  Fuel,
  LayoutDashboard,
  MapPin,
  ShoppingCart,
  User,
  Bell,
  LogOut,
  X,
  Truck,
  Users,
  Settings,
  Receipt,
  FileText,
  DollarSign,
  Package,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const customerLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'My Orders', icon: ShoppingCart },
  { href: '/dashboard/order/new', label: 'Order Fuel', icon: Fuel },
  { href: '/dashboard/sites', label: 'Delivery Sites', icon: MapPin },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const individualCustomerLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'My Orders', icon: ShoppingCart },
  { href: '/dashboard/order/new', label: 'Order Fuel', icon: Fuel },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/delivery-partners', label: 'Delivery Partners', icon: Truck },
  { href: '/admin/vehicles', label: 'Vehicles', icon: Package },
  { href: '/admin/pricing', label: 'Pricing', icon: DollarSign },
  { href: '/admin/supplier-bills', label: 'Supplier Bills', icon: FileText },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];

const deliveryLinks = [
  { href: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/delivery/orders', label: 'My Deliveries', icon: Truck },
  { href: '/delivery/notifications', label: 'Notifications', icon: Bell },
  { href: '/delivery/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const links =
    user?.role === 'admin'
      ? adminLinks
      : user?.role === 'delivery_partner'
        ? deliveryLinks
        : user?.profileType === 'individual'
          ? individualCustomerLinks
          : customerLinks;

  const isOrg = user?.profileType === 'organization';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-2">
              <Fuel className="h-7 w-7 text-fuel-orange" />
              <span className="text-lg font-bold text-gray-900">FuelOrder</span>
            </Link>
            <button onClick={onClose} className="lg:hidden text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm',
                isOrg ? 'bg-orange-100 text-orange-700' : 'bg-primary-100 text-primary-700'
              )}>
                {isOrg ? (user?.organizationName?.[0]?.toUpperCase() || 'O') : (user?.name?.[0]?.toUpperCase() || 'U')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {isOrg ? (user?.organizationName || user?.name) : user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {isOrg ? 'Organization' : user?.profileType === 'individual' ? 'Individual' : user?.role?.replace('_', ' ')}
                </p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 transition-colors" title="Logout">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
