import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

function ManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await axiosInstance.get('/requests');
      setRequests(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id) => {
    try {
      await axiosInstance.post(`/requests/${id}/approve`, { manager_notes: "Approved by Manager" });
      fetchRequests();
    } catch (err) { alert(err.response?.data?.error); }
  };

  const handleConfirmReceipt = async (id) => {
    try {
      setLoading(true);
      await axiosInstance.post(`/requests/${id}/confirm-receipt`);
      alert("Receipt confirmed. Item stock has been updated in the database.");
      fetchRequests();
    } catch (err) { alert(err.response?.data?.error); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Replenishment Request Queue</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3 text-left">Item / SKU</th>
              <th className="px-6 py-3 text-left">Qty</th>
              <th className="px-6 py-3 text-left">Supplier</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{req.item_name} <br/><span className="text-xs text-gray-400">{req.sku}</span></td>
                <td className="px-6 py-4">{req.requested_qty}</td>
                <td className="px-6 py-4">{req.supplier_name}</td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    req.status === 'pending' ? 'bg-orange-100 text-orange-800' : 
                    req.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {req.status === 'pending' && (
                    <button onClick={() => handleApprove(req.id)} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">Approve</button>
                  )}
                  {req.status === 'delivered' && (
                    <button onClick={() => handleConfirmReceipt(req.id)} disabled={loading} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                      Confirm Receipt
                    </button>
                  )}
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