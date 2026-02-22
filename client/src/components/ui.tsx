import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('badge', getStatusColor(status))}>
      {getStatusLabel(status)}
    </span>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-900 font-medium">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );
}

export function StatCard({
  title,
  value,
  icon,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-xl', colorMap[color])}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
