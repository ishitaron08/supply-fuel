'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Truck, FileText, Download } from 'lucide-react';
import { StatusBadge, LoadingSpinner } from '@/components/ui';
import { formatCurrency, formatDate, formatDateTime, getPaymentStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.data)).catch(() => router.push('/dashboard/orders')).finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <LoadingSpinner />;
  if (!order) return null;

  const site = order.deliverySiteId;

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order Details */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Order Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Fuel Type</p>
            <p className="font-medium capitalize">{order.fuelType}</p>
          </div>
          <div>
            <p className="text-gray-500">Quantity</p>
            <p className="font-medium">{order.quantityLiters?.toLocaleString()} L</p>
          </div>
          <div>
            <p className="text-gray-500">Price/Liter</p>
            <p className="font-medium">{formatCurrency(order.pricePerLiter)}</p>
          </div>
          <div>
            <p className="text-gray-500">Subtotal</p>
            <p className="font-medium">{formatCurrency(order.pricePerLiter * order.quantityLiters)}</p>
          </div>
          <div>
            <p className="text-gray-500">GST ({order.gstPercentage}%)</p>
            <p className="font-medium">{formatCurrency(order.gstAmount)}</p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold">Total</p>
            <p className="font-bold text-primary-700">{formatCurrency(order.totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Delivery Site */}
      {site && (
        <div className="card p-6 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Delivery Site</h2>
          </div>
          <p className="text-sm text-gray-700 font-medium">{site.siteName}</p>
          <p className="text-sm text-gray-600">{site.address}</p>
          <p className="text-sm text-gray-600">{site.city}, {site.state} — {site.pincode}</p>
          <p className="text-sm text-gray-500">Contact: {site.contactPerson} ({site.contactPhone})</p>
        </div>
      )}

      {/* Payment & Delivery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-6 space-y-2">
          <h2 className="font-semibold text-gray-900">Payment</h2>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">Mode:</span> <span className="capitalize font-medium">{order.paymentMode}</span></p>
            <p>
              <span className="text-gray-500">Status:</span>{' '}
              <span className={cn('badge', getPaymentStatusColor(order.paymentStatus))}>{order.paymentStatus}</span>
            </p>
          </div>
        </div>
        <div className="card p-6 space-y-2">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Delivery</h2>
          </div>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">Requested:</span> {formatDate(order.requestedDeliveryDate)}</p>
            {order.deliveredAt && <p><span className="text-gray-500">Delivered:</span> {formatDateTime(order.deliveredAt)}</p>}
            {order.assignedPartnerId && (
              <p><span className="text-gray-500">Partner:</span> {order.assignedPartnerId.name || 'Assigned'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Rejection reason */}
      {order.status === 'rejected' && order.rejectionReason && (
        <div className="card p-6 bg-red-50 border-red-200">
          <h2 className="font-semibold text-red-700 mb-1">Rejection Reason</h2>
          <p className="text-sm text-red-600">{order.rejectionReason}</p>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Notes</h2>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}

      {/* Invoice download */}
      {order.status === 'delivered' && (
        <div className="card p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-900">Invoice</span>
          </div>
          <button
            onClick={async () => {
              try {
                const { data } = await api.get(`/invoices/order/${order._id}`);
                if (data.data?.pdfUrl) {
                  window.open(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${data.data.pdfUrl}`, '_blank');
                }
              } catch {
                // Try to trigger generation
                await api.post(`/invoices/order/${order._id}/generate`);
              }
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Download className="h-4 w-4" /> Download Invoice
          </button>
        </div>
      )}
    </div>
  );
}
