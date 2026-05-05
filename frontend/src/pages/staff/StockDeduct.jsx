import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

function StockDeduct() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state?.item;

  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/stock/deduct', {
        item_id: id,
        deduct_qty: parseInt(qty),
        reason
      });
      alert("Stock updated. If threshold was reached, a request has been generated.");
      navigate('/staff');
    } catch (err) {
      alert(err.response?.data?.error || "Error updating stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Record Stock Usage</h2>
      <p className="text-gray-600 mb-6">Item: <span className="font-bold">{item?.name || `ID: ${id}`}</span></p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Quantity Used</label>
          <input 
            type="number" 
            min="1" 
            max={item?.current_qty}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Reason / Notes</label>
          <textarea 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Sold to customer, Damaged"
          ></textarea>
        </div>
        <div className="flex justify-between">
          <button type="button" onClick={() => navigate('/staff')} className="text-gray-600">Cancel</button>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? 'Updating...' : 'Confirm Deduction'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StockDeduct;