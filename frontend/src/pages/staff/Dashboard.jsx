import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 6;

// Stat card
const StatCard = ({ label, value, color, icon }) => (
  <div className={`bg-white rounded-xl shadow-sm border-l-4 ${color} p-4 flex items-center gap-4`}>
    <span className="text-3xl">{icon}</span>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
);

// Custom tooltip for bar chart
const ChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white shadow-lg border border-gray-100 rounded-xl px-4 py-3 text-sm">
        <p className="font-bold text-gray-800 mb-1">{d.name}</p>
        <p className="text-gray-600">Stock: <span className="font-semibold">{d.current_qty}</span></p>
        <p className="text-gray-400">Threshold: {d.min_threshold}</p>
      </div>
    );
  }
  return null;
};

function StaffDashboard() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/items');
      setItems(res.data);
    } catch (err) {
      const msg = 'Failed to load inventory.';
      setError(msg);
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages  = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated   = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [search]);

  // Stats
  const totalItems    = items.length;
  const lowStockCount = items.filter(i => i.current_qty <= i.min_threshold).length;
  const healthyCount  = totalItems - lowStockCount;

  // Chart data — all items sorted by stock level
  const chartData = [...items]
    .sort((a, b) => a.current_qty - b.current_qty)
    .map(i => ({
      name: i.name.length > 12 ? i.name.substring(0, 11) + '…' : i.name,
      current_qty: i.current_qty,
      min_threshold: i.min_threshold,
      isLow: i.current_qty <= i.min_threshold,
    }));

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
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Items"        value={totalItems}    color="border-indigo-500" icon="📦" />
        <StatCard label="Low Stock Items"    value={lowStockCount} color="border-red-500"    icon="⚠️" />
        <StatCard label="Healthy Stock"      value={healthyCount}  color="border-green-500"  icon="✅" />
      </div>

      {/* Stock Level Chart */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">Stock Level Overview</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="current_qty" name="Current Stock" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.isLow ? '#ef4444' : '#6366f1'} />
                ))}
              </Bar>
              <Bar dataKey="min_threshold" name="Min Threshold" fill="#d1d5db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-center text-gray-400 mt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1"></span>Red = below threshold &nbsp;
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-1"></span>Indigo = healthy
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl font-bold text-gray-800">Inventory Table</h1>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            className="border rounded-lg px-3 py-2 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.length === 0 && (
                <tr><td colSpan="6" className="text-center py-10 text-gray-400 italic">No items found.</td></tr>
              )}
              {paginated.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.current_qty <= item.min_threshold ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 font-medium">
                    {item.name}
                    {item.current_qty <= item.min_threshold && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">LOW</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-500">{item.sku}</td>
                  <td className={`px-6 py-4 font-bold text-lg ${item.current_qty <= item.min_threshold ? 'text-red-600' : 'text-green-600'}`}>
                    {item.current_qty}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.min_threshold}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.supplier_name || '—'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/staff/deduct/${item.id}`, { state: { item } })}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                    >
                      Record Usage
                    </button>
                  </td>
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

export default StaffDashboard;