'use client';

import DashboardShell from '@/components/DashboardShell';

export default function DeliveryDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell allowedRoles={['delivery_partner']}>
      {children}
    </DashboardShell>
  );
}
