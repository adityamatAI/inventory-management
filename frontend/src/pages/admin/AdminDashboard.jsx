import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import SuppliersMap from './SuppliersMap';

const TABS = [
  { id: 'users',  label: '👥 Users',         description: 'Create, edit & deactivate' },
  { id: 'roles',  label: '🔑 Roles',         description: 'Assign user roles'          },
  { id: 'audit',  label: '📋 Audit Log',     description: 'Full system activity trail' },
  { id: 'map',    label: '🗺️ Suppliers Map', description: 'Geographic supplier view'  },
];

// ── Audit Log Sub-Component ───────────────────────────────────────────────────
function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 15;

  // Filter state
  const [filters, setFilters] = useState({ username: '', action: '', from: '', to: '' });
  const [appliedFilters, setAppliedFilters] = useState({});
  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== '');

  const buildQuery = (pageNum, activeFilters) => {
    const params = new URLSearchParams({ page: pageNum, limit: LIMIT });
    if (activeFilters.username) params.append('username', activeFilters.username);
    if (activeFilters.action)   params.append('action',   activeFilters.action);
    if (activeFilters.from)     params.append('from',     activeFilters.from);
    if (activeFilters.to)       params.append('to',       activeFilters.to);
    return params.toString();
  };

  const fetchLogs = async (pageNum = 1, activeFilters = appliedFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/admin/audit-logs?${buildQuery(pageNum, activeFilters)}`);
      setLogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages || 1);
      if (res.data.actionTypes) setActionTypes(res.data.actionTypes);
    } catch (err) {
      setError('Failed to load audit logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(page, appliedFilters); }, [page]);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
    fetchLogs(1, filters);
  };

  const handleClearFilters = () => {
    const empty = { username: '', action: '', from: '', to: '' };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
    fetchLogs(1, empty);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">System Audit Trail</h2>
          <p className="text-sm text-gray-500 mt-0.5">Every action taken in the system, in reverse chronological order</p>
        </div>
        <button onClick={() => fetchLogs(page)} className="text-sm text-indigo-600 hover:underline">↻ Refresh</button>
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filter Logs</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Username search */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Username</label>
            <input
              type="text"
              placeholder="Search username..."
              value={filters.username}
              onChange={e => setFilters(f => ({ ...f, username: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {/* Action type dropdown */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Action Type</label>
            <select
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All actions</option>
              {actionTypes.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          {/* From date */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={filters.from}
              onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {/* To date */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={filters.to}
              onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-white transition-colors"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={handleApplyFilters}
            className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Apply Filters
          </button>
        </div>
        {hasActiveFilters && (
          <p className="text-xs text-indigo-600 mt-2">
            ● Filters active — showing filtered results
          </p>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-500">Loading...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
          <button onClick={() => fetchLogs(page)} className="mt-2 text-sm underline">Retry</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-800 text-white text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Timestamp</th>
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Action</th>
                <th className="px-6 py-3 text-left">Entity</th>
                <th className="px-6 py-3 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {logs.length === 0 && (
                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No audit entries match your filters.</td></tr>
              )}
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-xs whitespace-nowrap text-gray-500">{log.created_at}</td>
                  <td className="px-6 py-3 font-semibold text-gray-800">{log.username || 'System'}</td>
                  <td className="px-6 py-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide">{log.action}</span>
                  </td>
                  <td className="px-6 py-3 capitalize text-gray-600">
                    {log.entity_type} <span className="text-gray-400 text-xs">#{log.entity_id}</span>
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-400 max-w-xs truncate">{log.details_json}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Admin Dashboard (Tab Hub) ─────────────────────────────────────────────────
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  const renderTab = () => {
    switch (activeTab) {
      case 'users': return <UserManagement />;
      case 'roles': return <RoleManagement />;
      case 'audit': return <AuditLog />;
      case 'map':   return <SuppliersMap />;
      default:      return null;
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">System administration — manage users, roles, and monitor activity</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {renderTab()}
      </div>
    </div>
  );
}

export default AdminDashboard;