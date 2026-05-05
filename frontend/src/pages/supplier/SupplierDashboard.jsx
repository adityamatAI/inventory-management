import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import axiosInstance from '../../api/axiosInstance';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 8;

const StatusBadge = ({ status }) => {
  const colors = {
    forwarded: 'bg-blue-100 text-blue-800',
    accepted:  'bg-purple-100 text-purple-800',
    sent:      'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    closed:    'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const StatCard = ({ label, value, color, icon }) => (
  <div className={`bg-white rounded-xl shadow-sm border-l-4 ${color} p-4 flex items-center gap-4`}>
    <span className="text-3xl">{icon}</span>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
);

function SupplierDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [page, setPage] = useState(1);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/supplier/requests');
      setRequests(res.data);
    } catch (err) {
      const msg = 'Failed to load orders.';
      setError(msg);
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (requestId, nextStatus) => {
    setActionLoading(requestId);
    const labels = { accepted: 'Accepting order…', sent: 'Marking as sent…', delivered: 'Marking as delivered…' };
    const loadingToast = toast.loading(labels[nextStatus] || 'Updating…');
    try {
      await axiosInstance.put(`/supplier/requests/${requestId}/status`, { status: nextStatus });
      const successMsgs = { accepted: 'Order accepted!', sent: 'Marked as sent.', delivered: 'Marked as delivered — awaiting manager confirmation.' };
      toast.success(successMsgs[nextStatus] || 'Status updated.', { id: loadingToast });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status.', { id: loadingToast });
    } finally {
      setActionLoading(null);
    }
  };

  const getActionButton = (req) => {
    const isLoading = actionLoading === req.id;
    const btnBase = 'px-3 py-1 rounded text-xs font-medium disabled:opacity-50 transition-colors';
    switch (req.status) {
      case 'forwarded': return (
        <button onClick={() => updateStatus(req.id, 'accepted')} disabled={isLoading}
          className={`${btnBase} bg-blue-500 text-white hover:bg-blue-600`}>
          {isLoading ? '…' : 'Accept Order'}
        </button>
      );
      case 'accepted': return (
        <button onClick={() => updateStatus(req.id, 'sent')} disabled={isLoading}
          className={`${btnBase} bg-yellow-500 text-white hover:bg-yellow-600`}>
          {isLoading ? '…' : 'Mark as Sent'}
        </button>
      );
      case 'sent': return (
        <button onClick={() => updateStatus(req.id, 'delivered')} disabled={isLoading}
          className={`${btnBase} bg-green-500 text-white hover:bg-green-600`}>
          {isLoading ? '…' : 'Mark as Delivered'}
        </button>
      );
      default: return <span className="text-gray-400 italic text-xs">No actions</span>;
    }
  };

  const activeOrders    = requests.filter(r => !['closed', 'rejected'].includes(r.status)).length;
  const awaitingAction  = requests.filter(r => ['forwarded', 'accepted', 'sent'].includes(r.status)).length;
  const totalPages      = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const paginated       = requests.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-gray-500">Loading orders...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
      <p className="font-semibold">Error</p>
      <p className="text-sm">{error}</p>
      <button onClick={fetchRequests} className="mt-3 text-sm underline">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Orders"      value={requests.length} color="border-indigo-500" icon="📦" />
        <StatCard label="Active Orders"     value={activeOrders}    color="border-blue-500"   icon="🔄" />
        <StatCard label="Awaiting Action"   value={awaitingAction}  color="border-yellow-400" icon="⚡" />
      </div>

      {/* Orders Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl font-bold text-gray-800">Supplier Order Portal</h1>
          <button onClick={fetchRequests} className="text-sm text-indigo-600 hover:underline">↻ Refresh</button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.length === 0 && (
                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No active orders assigned.</td></tr>
              )}
              {paginated.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm text-gray-500">#{req.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{req.item_name}</td>
                  <td className="px-6 py-4 text-gray-600">{req.requested_qty}</td>
                  <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                  <td className="px-6 py-4">{getActionButton(req)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default SupplierDashboard;