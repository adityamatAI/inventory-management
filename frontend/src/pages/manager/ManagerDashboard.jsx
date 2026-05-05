import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-orange-100 text-orange-800',
    forwarded: 'bg-blue-100 text-blue-800',
    accepted: 'bg-purple-100 text-purple-800',
    sent: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-600',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

function ManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/requests');
      setRequests(res.data);
    } catch (err) {
      setError('Failed to load requests. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id) => {
    const notes = window.prompt('Add manager notes (optional):') ?? 'Approved by Manager';
    setActionLoading(id);
    try {
      await axiosInstance.post(`/requests/${id}/approve`, { manager_notes: notes });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Error approving request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const notes = window.prompt('Reason for rejection (required):');
    if (notes === null) return; // user cancelled the prompt
    setActionLoading(id);
    try {
      await axiosInstance.post(`/requests/${id}/reject`, { manager_notes: notes });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Error rejecting request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReceipt = async (id) => {
    setActionLoading(id);
    try {
      await axiosInstance.post(`/requests/${id}/confirm-receipt`);
      alert('Receipt confirmed. Stock has been updated.');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Error confirming receipt');
    } finally {
      setActionLoading(null);
    }
  };

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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Replenishment Request Queue</h1>
        <button onClick={fetchRequests} className="text-sm text-indigo-600 hover:underline">↻ Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3 text-left">Item / SKU</th>
              <th className="px-6 py-3 text-left">Qty</th>
              <th className="px-6 py-3 text-left">Supplier</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 && (
              <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No requests found.</td></tr>
            )}
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {req.item_name}
                  <br /><span className="text-xs text-gray-400">{req.sku}</span>
                </td>
                <td className="px-6 py-4">{req.requested_qty}</td>
                <td className="px-6 py-4">{req.supplier_name}</td>
                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading === req.id}
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {actionLoading === req.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                          className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                        >
                          {actionLoading === req.id ? '...' : 'Reject'}
                        </button>
                      </>
                    )}
                    {req.status === 'delivered' && (
                      <button
                        onClick={() => handleConfirmReceipt(req.id)}
                        disabled={actionLoading === req.id}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === req.id ? 'Updating...' : 'Confirm Receipt'}
                      </button>
                    )}
                    {!['pending', 'delivered'].includes(req.status) && (
                      <span className="text-gray-400 italic text-sm">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManagerDashboard;