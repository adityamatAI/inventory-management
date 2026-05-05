import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

function SupplierDashboard() {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res = await axiosInstance.get('/supplier/requests');
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch supplier requests", err);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (requestId, nextStatus) => {
    try {
      await axiosInstance.put(`/supplier/requests/${requestId}/status`, { status: nextStatus });
      fetchRequests(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.error || "Error updating status");
    }
  };

  const getActionButton = (req) => {
    switch (req.status) {
      case 'forwarded':
        return <button onClick={() => updateStatus(req.id, 'accepted')} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Accept Order</button>;
      case 'accepted':
        return <button onClick={() => updateStatus(req.id, 'sent')} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">Mark as Sent</button>;
      case 'sent':
        return <button onClick={() => updateStatus(req.id, 'delivered')} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Mark as Delivered</button>;
      default:
        return <span className="text-gray-400 italic">No actions</span>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Supplier Order Portal</h1>
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
          {requests.map((req) => (
            <tr key={req.id}>
              <td className="px-6 py-4">#{req.id}</td>
              <td className="px-6 py-4 font-medium">{req.item_name}</td>
              <td className="px-6 py-4">{req.requested_qty}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                  req.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {req.status}
                </span>
              </td>
              <td className="px-6 py-4">{getActionButton(req)}</td>
            </tr>
          ))}
          {requests.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-gray-500">No active orders assigned.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default SupplierDashboard;