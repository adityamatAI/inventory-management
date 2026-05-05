import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import axiosInstance from '../../api/axiosInstance';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 6;

const ROLE_COLORS = {
  admin: 'bg-red-50 text-red-700 border-red-200',
  manager: 'bg-blue-50 text-blue-700 border-blue-200',
  staff: 'bg-green-50 text-green-700 border-green-200',
  supplier: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function RoleManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [pendingRoles, setPendingRoles] = useState({});
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, roleRes] = await Promise.all([
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/admin/roles'),
      ]);
      setUsers(userRes.data);
      setRoles(roleRes.data);
    } catch (err) {
      setError('Failed to load data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getRoleId = (roleName) => {
    return roles.find(r => r.name === roleName)?.id;
  };

  const handleRoleChange = (userId, newRoleId) => {
    setPendingRoles(prev => ({ ...prev, [userId]: newRoleId }));
  };

  const handleSaveRole = async (user) => {
    const newRoleId = pendingRoles[user.id];
    if (!newRoleId) return;

    setSavingId(user.id);
    const newRoleName = roles.find(r => r.id == newRoleId)?.name || 'new role';
    const loadingToast = toast.loading(`Updating role for ${user.username}...`);
    try {
      await axiosInstance.put(`/admin/users/${user.id}`, {
        role_id: parseInt(newRoleId),
        is_active: user.is_active,
      });
      setPendingRoles(prev => { const n = { ...prev }; delete n[user.id]; return n; });
      setSavedId(user.id);
      toast.success(`${user.username}'s role updated to "${newRoleName}".`, { id: loadingToast });
      setTimeout(() => setSavedId(null), 2000);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role.', { id: loadingToast });
    } finally {
      setSavingId(null);
    }
  };

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginated  = users.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-gray-500">Loading roles...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <p className="text-sm">{error}</p>
      <button onClick={fetchData} className="mt-2 text-sm underline">Retry</button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Role Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">Assign or change roles for any user. Changes take effect immediately.</p>
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {roles.map(r => (
          <span key={r.id} className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${ROLE_COLORS[r.name] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {r.name}
          </span>
        ))}
        <span className="text-xs text-gray-400 self-center ml-2">— Available roles in the system</span>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign New Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.length === 0 && (
              <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No users found.</td></tr>
            )}
            {paginated.map(u => {
              const currentRoleId = getRoleId(u.role);
              const pendingRoleId = pendingRoles[u.id];
              const hasChange = pendingRoleId && pendingRoleId != currentRoleId;

              return (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.username}</p>
                        <p className="text-xs text-gray-400">ID #{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`capitalize text-xs font-bold px-3 py-1 rounded-full border ${ROLE_COLORS[u.role] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={pendingRoleId || currentRoleId || ''}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_active
                      ? <span className="text-green-600 text-xs font-semibold">● Active</span>
                      : <span className="text-red-500 text-xs font-semibold">● Inactive</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    {savedId === u.id ? (
                      <span className="text-green-600 text-sm font-medium">✓ Saved</span>
                    ) : (
                      <button
                        onClick={() => handleSaveRole(u)}
                        disabled={!hasChange || savingId === u.id}
                        className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                          hasChange
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {savingId === u.id ? 'Saving...' : 'Apply'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default RoleManagement;
