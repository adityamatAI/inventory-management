import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const logRes = await axiosInstance.get('/admin/audit-logs');
      const userRes = await axiosInstance.get('/admin/users');
      setLogs(logRes.data.data);
      setUsers(userRes.data);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* User Management Section */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-xs">
            <tr>
              <th className="px-6 py-3 text-left font-medium uppercase">Username</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Role</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-6 py-4">{u.username}</td>
                <td className="px-6 py-4 uppercase text-xs font-bold">{u.role}</td>
                <td className="px-6 py-4">{u.is_active ? '✅ Active' : '❌ Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Audit Log Section */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">System Audit Trail</h2>
        <div className="overflow-x-auto">
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
            <tbody className="divide-y divide-gray-200">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-xs whitespace-nowrap">{log.created_at}</td>
                  <td className="px-6 py-4 font-bold">{log.username || 'System'}</td>
                  <td className="px-6 py-4"><span className="bg-gray-200 px-2 py-0.5 rounded text-[10px] font-mono">{log.action}</span></td>
                  <td className="px-6 py-4 capitalize">{log.entity_type} (#{log.entity_id})</td>
                  <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{log.details_json}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;