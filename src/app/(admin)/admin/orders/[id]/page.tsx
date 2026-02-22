'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Truck, CheckCircle, XCircle, UserPlus, FileText, Download } from 'lucide-react';
import { StatusBadge, LoadingSpinner } from '@/components/ui';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate, formatDateTime, getPaymentStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [rejectOpen, setRejectOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [partners, setPartners] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [acting, setActing] = useState(false);

  const fetchOrder = () => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.data)).catch(() => router.push('/admin/orders')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleApprove = async () => {
    setActing(true);
    try {
      await api.put(`/orders/${id}/approve`);
      toast.success('Order approved');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) { toast.error('Reason is required'); return; }
    setActing(true);
    try {
      await api.put(`/orders/${id}/reject`, { reason: rejectionReason });
      toast.success('Order rejected');
      setRejectOpen(false);
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActing(false);
    }
  };

  const openAssignModal = async () => {
    try {
      const p = await api.get('/users/delivery-partners');
      setPartners(p.data.data || []);
      setVehicles([]);
      setSelectedPartner('');
      setSelectedVehicle('');
      setAssignOpen(true);
    } catch {
      toast.error('Failed to load delivery partners');
    }
  };

  const handlePartnerChange = async (partnerId: string) => {
    setSelectedPartner(partnerId);
    setSelectedVehicle('');
    if (!partnerId) { setVehicles([]); return; }
    try {
      const v = await api.get(`/vehicles?driverId=${partnerId}`);
      setVehicles(v.data.data || []);
    } catch {
      toast.error('Failed to load vehicles');
    }
  };

  const handleAssign = async () => {
    if (!selectedPartner || !selectedVehicle) { toast.error('Select both partner and vehicle'); return; }
    setActing(true);
    try {
      await api.put(`/orders/${id}/assign`, {
        partnerId: selectedPartner,
        vehicleId: selectedVehicle,
      });
      toast.success('Order assigned');
      setAssignOpen(false);
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign');
    } finally {
      setActing(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!confirm('Mark this order as delivered?')) return;
    setActing(true);
    try {
      await api.put(`/orders/${id}/status`, { status: 'delivered' });
      toast.success('Order marked as delivered');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return null;

  const site = order.deliverySiteId;
  const customer = order.customerId;

  return (
    <div className="max-w-4xl space-y-6">
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

      {/* Admin Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {order.status === 'pending' && (
          <>
            <button onClick={handleApprove} disabled={acting} className="btn-success flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Approve
            </button>
            <button onClick={() => setRejectOpen(true)} disabled={acting} className="btn-danger flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Reject
            </button>
          </>
        )}
        {order.status === 'approved' && (
          <button onClick={openAssignModal} disabled={acting} className="btn-primary flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Assign Delivery
          </button>
        )}
        {order.status === 'out_for_delivery' && (
          <button onClick={handleMarkDelivered} disabled={acting} className="btn-success flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Mark Delivered
          </button>
        )}
      </div>

      {/* Customer Info */}
      {customer && (
        <div className="card p-6 space-y-2">
          <h2 className="font-semibold text-gray-900">Customer</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div><p className="text-gray-500">Name</p><p className="font-medium">{customer.name}</p></div>
            <div><p className="text-gray-500">Email</p><p className="font-medium">{customer.email}</p></div>
            <div><p className="text-gray-500">Phone</p><p className="font-medium">{customer.phone || '—'}</p></div>
            {customer.organizationName && (
              <div><p className="text-gray-500">Organization</p><p className="font-medium">{customer.organizationName}</p></div>
            )}
            {customer.gstNumber && (
              <div><p className="text-gray-500">GST</p><p className="font-medium">{customer.gstNumber}</p></div>
            )}
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Order Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div><p className="text-gray-500">Fuel Type</p><p className="font-medium capitalize">{order.fuelType}</p></div>
          <div><p className="text-gray-500">Quantity</p><p className="font-medium">{order.quantityLiters?.toLocaleString()} L</p></div>
          <div><p className="text-gray-500">Price/Liter</p><p className="font-medium">{formatCurrency(order.pricePerLiter)}</p></div>
          <div><p className="text-gray-500">Subtotal</p><p className="font-medium">{formatCurrency(order.pricePerLiter * order.quantityLiters)}</p></div>
          <div><p className="text-gray-500">GST ({order.gstPercentage}%)</p><p className="font-medium">{formatCurrency(order.gstAmount)}</p></div>
          <div><p className="text-gray-500 font-semibold">Total</p><p className="font-bold text-primary-700">{formatCurrency(order.totalAmount)}</p></div>
        </div>
      </div>

      {/* Site & Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {site && (
          <div className="card p-6 space-y-2">
            <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary-600" /><h2 className="font-semibold text-gray-900">Delivery Site</h2></div>
            <p className="text-sm font-medium">{site.siteName}</p>
            <p className="text-sm text-gray-600">{site.address}, {site.city}, {site.state} — {site.pincode}</p>
            <p className="text-sm text-gray-500">Contact: {site.contactPerson} ({site.contactPhone})</p>
          </div>
        )}
        <div className="card p-6 space-y-2">
          <h2 className="font-semibold text-gray-900">Payment</h2>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">Mode:</span> <span className="capitalize font-medium">{order.paymentMode}</span></p>
            <p><span className="text-gray-500">Status:</span> <span className={cn('badge', getPaymentStatusColor(order.paymentStatus))}>{order.paymentStatus}</span></p>
            <p><span className="text-gray-500">Requested Delivery:</span> {formatDate(order.requestedDeliveryDate)}</p>
            {order.deliveredAt && <p><span className="text-gray-500">Delivered:</span> {formatDateTime(order.deliveredAt)}</p>}
          </div>
        </div>
      </div>

      {/* Assignment Info */}
      {order.assignedPartnerId && (
        <div className="card p-6 space-y-2">
          <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary-600" /><h2 className="font-semibold text-gray-900">Assigned Delivery</h2></div>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">Partner:</span> {order.assignedPartnerId.name || 'Assigned'} ({order.assignedPartnerId.email || ''})</p>
            {order.assignedVehicleId && <p><span className="text-gray-500">Vehicle:</span> {order.assignedVehicleId.vehicleNumber} ({order.assignedVehicleId.type})</p>}
          </div>
        </div>
      )}

      {/* Rejection */}
      {order.status === 'rejected' && order.rejectionReason && (
        <div className="card p-6 bg-red-50 border-red-200">
          <h2 className="font-semibold text-red-700 mb-1">Rejection Reason</h2>
          <p className="text-sm text-red-600">{order.rejectionReason}</p>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Customer Notes</h2>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}

      {/* Invoice */}
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
                try {
                  await api.post(`/invoices/order/${order._id}/generate`);
                  toast.success('Invoice generated');
                } catch { toast.error('Failed to generate invoice'); }
              }
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Download className="h-4 w-4" /> Download Invoice
          </button>
        </div>
      )}

      {/* Reject Modal */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Order">
        <div className="space-y-4">
          <div>
            <label className="label">Rejection Reason *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Explain why this order is being rejected..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRejectOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReject} disabled={acting} className="btn-danger">
              {acting ? 'Rejecting...' : 'Reject Order'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Delivery">
        <div className="space-y-4">
          <div>
            <label className="label">Delivery Partner *</label>
            <select value={selectedPartner} onChange={(e) => handlePartnerChange(e.target.value)} className="input-field">
              <option value="">Select partner...</option>
              {partners.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vehicle *</label>
            <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="input-field" disabled={!selectedPartner}>
              <option value="">
                {!selectedPartner ? 'Select a partner first' : vehicles.length === 0 ? 'No vehicles for this partner' : 'Select vehicle...'}
              </option>
              {vehicles.map((v: any) => (
                <option key={v._id} value={v._id}>
                  {v.vehicleNumber} — {v.type} ({v.capacity}L) {v.isAvailable ? '✓' : '⚠ unavailable'}
                </option>
              ))}
            </select>
            {selectedPartner && vehicles.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No vehicles assigned to this partner. Go to Vehicles to assign one.</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setAssignOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAssign} disabled={acting} className="btn-primary">
              {acting ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
