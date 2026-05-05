import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
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
    const loadingToast = toast.loading('Updating stock...');
    try {
      await axiosInstance.post('/stock/deduct', {
        item_id: id,
        deduct_qty: parseInt(qty),
        reason,
      });
      toast.success('Stock updated. If threshold was crossed, a replenishment request has been auto-generated.', { id: loadingToast, duration: 5000 });
      navigate('/staff');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update stock.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100">
      <button onClick={() => navigate('/staff')} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
        ← Back to Inventory
      </button>
      <h2 className="text-xl font-bold text-gray-800 mb-1">Record Stock Usage</h2>
      <p className="text-gray-500 text-sm mb-6">
        Item: <span className="font-semibold text-gray-800">{item?.name || `ID: ${id}`}</span>
        {item && <span className="ml-2 text-gray-400">(Current stock: {item.current_qty})</span>}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Used</label>
          <input
            type="number"
            min="1"
            max={item?.current_qty}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
          {item && parseInt(qty) > item.current_qty && (
            <p className="text-red-500 text-xs mt-1">Exceeds current stock ({item.current_qty})</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Sold to customer, Damaged goods..."
          />
        </div>

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? 'Updating...' : 'Confirm Deduction'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StockDeduct;