'use client';

import { useEffect, useState, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminSupplierBillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/supplier-bills?page=${page}&limit=15`);
      setBills(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Bills</h1>
        <button onClick={() => setUploadOpen(true)} className="btn-primary flex items-center gap-2">
          <Upload className="h-4 w-4" /> Upload Bill
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : bills.length === 0 ? (
        <EmptyState title="No supplier bills" description="Upload your first supplier bill." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-5 py-3 font-medium">Bill #</th>
                    <th className="px-5 py-3 font-medium">Vendor</th>
                    <th className="px-5 py-3 font-medium">Order #</th>
                    <th className="px-5 py-3 font-medium">Indent #</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bills.map((bill: any) => (
                    <tr key={bill._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">{bill.billNumber}</td>
                      <td className="px-5 py-4 text-gray-600">{bill.vendorName}</td>
                      <td className="px-5 py-4 text-gray-600">{bill.orderId?.orderNumber || '—'}</td>
                      <td className="px-5 py-4 text-gray-600">{bill.indentNumber || '—'}</td>
                      <td className="px-5 py-4 text-gray-900 font-medium">{formatCurrency(bill.amount)}</td>
                      <td className="px-5 py-4 text-gray-600">{formatDate(bill.createdAt)}</td>
                      <td className="px-5 py-4">
                        {bill.billFileUrl && (
                          <a
                            href={bill.billFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" /> View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <UploadBillModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={fetchBills} />
    </div>
  );
}

function UploadBillModal({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [orderId, setOrderId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [indentNumber, setIndentNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const STATUS_LABEL: Record<string, string> = {
    approved: '✓ Approved',
    assigned: '🚚 Assigned',
    out_for_delivery: '▶ Out for Delivery',
    delivered: '✅ Delivered',
  };

  useEffect(() => {
    if (open) {
      setOrdersLoading(true);
      // Fetch all actionable orders (not just delivered)
      Promise.all([
        api.get('/orders?status=approved&limit=50'),
        api.get('/orders?status=assigned&limit=50'),
        api.get('/orders?status=out_for_delivery&limit=50'),
        api.get('/orders?status=delivered&limit=100'),
      ])
        .then(([a, b, c, d]) => {
          const all = [
            ...(a.data.data || []),
            ...(b.data.data || []),
            ...(c.data.data || []),
            ...(d.data.data || []),
          ];
          setOrders(all);
        })
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !vendorName || !billNumber || !amount) {
      toast.error('Please fill all required fields: Vendor Name, Bill Number, Amount, and File');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('billFile', file);
      formData.append('orderId', orderId);
      formData.append('vendorName', vendorName);
      formData.append('billNumber', billNumber);
      formData.append('amount', amount);
      if (indentNumber) formData.append('indentNumber', indentNumber);

      await api.post('/supplier-bills', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Bill uploaded');
      onClose();
      onUploaded();
      // reset
      setOrderId(''); setVendorName(''); setBillNumber(''); setAmount(''); setIndentNumber(''); setFile(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload Supplier Bill" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Order <span className="text-gray-400 font-normal">(optional)</span></label>
          <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className="input-field" disabled={ordersLoading}>
            <option value="">{ordersLoading ? 'Loading orders…' : orders.length === 0 ? 'No orders available' : 'Select order...'}</option>
            {orders.map((o: any) => (
              <option key={o._id} value={o._id}>
                {o.orderNumber} — {o.customerId?.name || 'Unknown'} [{STATUS_LABEL[o.status] || o.status}]
              </option>
            ))}
          </select>
          {orders.length === 0 && !ordersLoading && (
            <p className="text-xs text-amber-600 mt-1">No approved/assigned/delivered orders found. Bills can only be linked to orders in progress or completed.</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vendor Name *</label>
            <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Bill Number *</label>
            <input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount *</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Indent Number</label>
            <input value={indentNumber} onChange={(e) => setIndentNumber(e.target.value)} className="input-field" />
          </div>
        </div>
        <div>
          <label className="label">Bill File (PDF/JPEG/PNG, max 5MB) *</label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="input-field"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Uploading...' : 'Upload Bill'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
