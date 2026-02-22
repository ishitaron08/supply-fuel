'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Eye, UserPlus } from 'lucide-react';
import { StatusBadge, LoadingSpinner, EmptyState } from '@/components/ui';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');

  // Quick-action state
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Assign state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const quickApprove = async (orderId: string) => {
    setActingId(orderId);
    try {
      await api.put(`/orders/${orderId}/approve`);
      toast.success('Order approved successfully');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve order');
    } finally {
      setActingId(null);
    }
  };

  const openRejectModal = (orderId: string) => {
    setRejectTargetId(orderId);
    setRejectReason('');
    setRejectOpen(true);
  };

  const quickReject = async () => {
    if (!rejectTargetId) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      toast.error('Rejection reason must be at least 5 characters');
      return;
    }
    setActingId(rejectTargetId);
    setRejectOpen(false);
    try {
      await api.put(`/orders/${rejectTargetId}/reject`, { reason: rejectReason });
      toast.success('Order rejected');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject order');
    } finally {
      setActingId(null);
      setRejectTargetId(null);
    }
  };

  const openAssignModal = async (orderId: string) => {
    setAssignTargetId(orderId);
    setSelectedPartner('');
    setSelectedVehicle('');
    setVehicles([]);
    try {
      const p = await api.get('/users/delivery-partners');
      setPartners(p.data.data || []);
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
    if (!assignTargetId || !selectedPartner || !selectedVehicle) {
      toast.error('Select both a delivery partner and a vehicle');
      return;
    }
    setActingId(assignTargetId);
    setAssignOpen(false);
    try {
      await api.put(`/orders/${assignTargetId}/assign`, {
        partnerId: selectedPartner,
        vehicleId: selectedVehicle,
      });
      toast.success('Order assigned successfully');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign order');
    } finally {
      setActingId(null);
      setAssignTargetId(null);
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        {pendingCount > 0 && !statusFilter && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />
            {pendingCount} pending approval
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="assigned">Assigned</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #..."
            className="input-field w-auto"
          />
          <button type="submit" className="btn-secondary text-sm">Search</button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order #</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Site / City</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order: any) => {
                    const isBusy = actingId === order._id;
                    return (
                      <tr key={order._id} className={`hover:bg-gray-50 ${order.status === 'pending' ? 'bg-yellow-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order._id}`} className="text-primary-600 hover:underline font-medium">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{order.customerId?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          <p>{order.deliverySiteId?.siteName || '—'}</p>
                          <p className="text-xs text-gray-400">{order.deliverySiteId?.city || ''}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-600 font-medium">{order.quantityLiters?.toLocaleString()}L</td>
                        <td className="px-4 py-3 text-gray-900 font-semibold">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {order.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => quickApprove(order._id)}
                                  disabled={!!actingId}
                                  title="Approve order"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  {isBusy ? '…' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => openRejectModal(order._id)}
                                  disabled={!!actingId}
                                  title="Reject order"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              </>
                            )}
                            {order.status === 'approved' && (
                              <button
                                onClick={() => openAssignModal(order._id)}
                                disabled={!!actingId}
                                title="Assign delivery partner"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                {actingId === order._id ? '…' : 'Assign'}
                              </button>
                            )}
                            <Link
                              href={`/admin/orders/${order._id}`}
                              title="View details"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Assign delivery modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Delivery Partner">
        <div className="space-y-4">
          <div>
            <label className="label">Delivery Partner *</label>
            <select
              value={selectedPartner}
              onChange={(e) => handlePartnerChange(e.target.value)}
              className="input-field"
            >
              <option value="">Select partner...</option>
              {partners.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vehicle *</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="input-field"
              disabled={!selectedPartner}
            >
              <option value="">
                {!selectedPartner ? 'Select a partner first' : vehicles.length === 0 ? 'No vehicles assigned to this partner' : 'Select vehicle...'}
              </option>
              {vehicles.map((v: any) => (
                <option key={v._id} value={v._id}>
                  {v.vehicleNumber} — {v.type} ({v.capacity}L){v.isAvailable ? '' : ' ⚠ unavailable'}
                </option>
              ))}
            </select>
            {selectedPartner && vehicles.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No vehicles are assigned to this partner. Go to Vehicles page to assign one.</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setAssignOpen(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleAssign}
              disabled={!selectedPartner || !selectedVehicle}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Assign
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject reason modal */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Order">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Please provide a reason for rejection. This will be sent to the customer.
          </p>
          <div>
            <label className="label">Rejection Reason *</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Delivery location is outside serviced area"
              className="input-field resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{rejectReason.length} / 5 minimum characters</p>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setRejectOpen(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={quickReject}
              disabled={rejectReason.trim().length < 5}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="h-4 w-4" /> Confirm Reject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
