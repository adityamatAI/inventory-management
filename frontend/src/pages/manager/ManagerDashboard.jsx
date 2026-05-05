import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 8;

const STATUS_COLORS = {
  pending:   '#f97316',
  forwarded: '#3b82f6',
  accepted:  '#a855f7',
  sent:      '#eab308',
  delivered: '#22c55e',
  closed:    '#9ca3af',
  rejected:  '#ef4444',
};

const StatusBadge = ({ status }) => {
  const colors = {
    pending:   'bg-orange-100 text-orange-800',
    forwarded: 'bg-blue-100 text-blue-800',
    accepted:  'bg-purple-100 text-purple-800',
    sent:      'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    closed:    'bg-gray-100 text-gray-600',
    rejected:  'bg-red-100 text-red-700',
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

const ChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg border border-gray-100 rounded-xl px-4 py-3 text-sm">
        <p className="font-bold capitalize">{payload[0].name}</p>
        <p className="text-gray-500">{payload[0].value} request{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
};

function ManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/requests');
      setRequests(res.data);
    } catch (err) {
      const msg = 'Failed to load requests.';
      setError(msg);
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const handleApprove = async (id) => {
    const notes = window.prompt('Add manager notes (optional):') ?? 'Approved by Manager';
    if (notes === null) return;
    setActionLoading(id);
    const loadingToast = toast.loading('Approving request...');
    try {
      await axiosInstance.post(`/requests/${id}/approve`, { manager_notes: notes });
      toast.success('Request approved and forwarded to supplier.', { id: loadingToast });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve request.', { id: loadingToast });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const notes = window.prompt('Reason for rejection (required):');
    if (notes === null) return;
    setActionLoading(id);
    const loadingToast = toast.loading('Rejecting request...');
    try {
      await axiosInstance.post(`/requests/${id}/reject`, { manager_notes: notes });
      toast.success('Request rejected.', { id: loadingToast });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject request.', { id: loadingToast });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReceipt = async (id) => {
    setActionLoading(id);
    const loadingToast = toast.loading('Confirming receipt...');
    try {
      await axiosInstance.post(`/requests/${id}/confirm-receipt`);
      toast.success('Receipt confirmed — stock has been updated.', { id: loadingToast });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to confirm receipt.', { id: loadingToast });
    } finally {
      setActionLoading(null);
    }
  };

  // Stats
  const stats = {
    total:     requests.length,
    pending:   requests.filter(r => r.status === 'pending').length,
    forwarded: requests.filter(r => r.status === 'forwarded').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
    closed:    requests.filter(r => r.status === 'closed').length,
  };

  // Chart data — status distribution
  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({ name: status, value: count }));

  // Filtered + paginated
  const filtered   = statusFilter ? requests.filter(r => r.status === statusFilter) : requests;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-gray-500">Loading requests...</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Requests"    value={stats.total}     color="border-indigo-500" icon="📋" />
        <StatCard label="Awaiting Review"   value={stats.pending}   color="border-orange-400" icon="⏳" />
        <StatCard label="With Supplier"     value={stats.forwarded} color="border-blue-500"   icon="🚚" />
        <StatCard label="Ready to Confirm"  value={stats.delivered} color="border-green-500"  icon="📬" />
      </div>

      {/* Chart + Table row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
            <h2 className="text-base font-bold text-gray-800 mb-3">Request Status Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.name] || '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Request Queue Table */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${chartData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-800">Request Queue</h1>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All statuses</option>
                {Object.keys(statusCounts).map(s => (
                  <option key={s} value={s}>{s} ({statusCounts[s]})</option>
                ))}
              </select>
              <button onClick={fetchRequests} className="text-sm text-indigo-600 hover:underline">↻</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Item / SKU</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No requests found.</td></tr>
                )}
                {paginated.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {req.item_name}
                      <br /><span className="text-xs text-gray-400 font-mono">{req.sku}</span>
                    </td>
                    <td className="px-4 py-3">{req.requested_qty}</td>
                    <td className="px-4 py-3 text-gray-600">{req.supplier_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={actionLoading === req.id}
                              className="bg-indigo-600 text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {actionLoading === req.id ? '…' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={actionLoading === req.id}
                              className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                            >
                              {actionLoading === req.id ? '…' : 'Reject'}
                            </button>
                          </>
                        )}
                        {req.status === 'delivered' && (
                          <button
                            onClick={() => handleConfirmReceipt(req.id)}
                            disabled={actionLoading === req.id}
                            className="bg-green-600 text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === req.id ? '…' : 'Confirm Receipt'}
                          </button>
                        )}
                        {!['pending', 'delivered'].includes(req.status) && (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;