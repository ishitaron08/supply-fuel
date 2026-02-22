'use client';

import DashboardShell from '@/components/DashboardShell';

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell allowedRoles={['customer']}>
      {children}
    </DashboardShell>
  );
}
