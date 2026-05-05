import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

function StaffDashboard() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchItems = async () => {
    try {
      const res = await axiosInstance.get('/items');
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch items", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
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
          {filteredItems.map((item) => (
            <tr key={item.id} className={item.current_qty <= item.min_threshold ? 'bg-red-50' : ''}>
              <td className="px-6 py-4 font-medium">{item.name}</td>
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