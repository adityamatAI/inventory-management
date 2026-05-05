import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

function StaffDashboard() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/items');
      setItems(res.data);
    } catch (err) {
      setError('Failed to load inventory. Please try again.');
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-gray-500">Loading inventory...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
      <p className="font-semibold">Error</p>
      <p className="text-sm">{error}</p>
      <button onClick={fetchItems} className="mt-3 text-sm underline">Retry</button>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Stock Levels</h1>
        <input
          type="text"
          placeholder="Search by name or SKU..."
          className="border rounded-md px-3 py-2 w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Threshold</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredItems.length === 0 && (
            <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No items found.</td></tr>
          )}
          {filteredItems.map((item) => (
            <tr key={item.id} className={item.current_qty <= item.min_threshold ? 'bg-red-50' : ''}>
              <td className="px-6 py-4 font-medium">
                {item.name}
                {item.current_qty <= item.min_threshold && (
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">LOW</span>
                )}
              </td>
              <td className="px-6 py-4">{item.sku}</td>
              <td className={`px-6 py-4 font-bold ${item.current_qty <= item.min_threshold ? 'text-red-600' : 'text-green-600'}`}>
                {item.current_qty}
              </td>
              <td className="px-6 py-4">{item.min_threshold}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => navigate(`/staff/deduct/${item.id}`, { state: { item } })}
                  className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm"
                >
                  Record Usage
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StaffDashboard;