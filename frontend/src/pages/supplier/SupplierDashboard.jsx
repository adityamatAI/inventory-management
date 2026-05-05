import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

const StatusBadge = ({ status }) => {
  const colors = {
    forwarded: 'bg-blue-100 text-blue-800',
    accepted: 'bg-purple-100 text-purple-800',
    sent: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

function SupplierDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/supplier/requests');
      setRequests(res.data);
    } catch (err) {
      setError('Failed to load orders. Please try again.');
      console.error('Failed to fetch supplier requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (requestId, nextStatus) => {
    setActionLoading(requestId);
    try {
      await axiosInstance.put(`/supplier/requests/${requestId}/status`, { status: nextStatus });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating status');
    } finally {
      setActionLoading(null);
    }
  };

  const getActionButton = (req) => {
    const isLoading = actionLoading === req.id;
    switch (req.status) {
      case 'forwarded':
        return (
          <button
            onClick={() => updateStatus(req.id, 'accepted')}
            disabled={isLoading}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '...' : 'Accept Order'}
          </button>
        );
      case 'accepted':
        return (
          <button
            onClick={() => updateStatus(req.id, 'sent')}
            disabled={isLoading}
            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
          >
            {isLoading ? '...' : 'Mark as Sent'}
          </button>
        );
      case 'sent':
        return (
          <button
            onClick={() => updateStatus(req.id, 'delivered')}
            disabled={isLoading}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? '...' : 'Mark as Delivered'}
          </button>
        );
      default:
        return <span className="text-gray-400 italic text-sm">No actions</span>;
    }
  };

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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Supplier Order Portal</h1>
        <button onClick={fetchRequests} className="text-sm text-indigo-600 hover:underline">↻ Refresh</button>
      </div>
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
          {requests.length === 0 && (
            <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No active orders assigned.</td></tr>
          )}
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-mono text-sm">#{req.id}</td>
              <td className="px-6 py-4 font-medium">{req.item_name}</td>
              <td className="px-6 py-4">{req.requested_qty}</td>
              <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
              <td className="px-6 py-4">{getActionButton(req)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SupplierDashboard;