'use client';

import DashboardShell from '@/components/DashboardShell';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell allowedRoles={['admin']}>
      {children}
    </DashboardShell>
  );
}
