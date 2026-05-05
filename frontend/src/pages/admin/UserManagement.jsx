import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import axiosInstance from '../../api/axiosInstance';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 6;

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '', role_id: '' });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role_id: '', is_active: 1 });
  const [editLoading, setEditLoading] = useState(false);

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
      const msg = 'Failed to load user data.';
      setError(msg);
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Create User ──────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    const loadingToast = toast.loading('Creating user...');
    try {
      await axiosInstance.post('/admin/users', {
        username: createForm.username,
        password: createForm.password,
        role_id: parseInt(createForm.role_id),
      });
      toast.success(`User "${createForm.username}" created successfully.`, { id: loadingToast });
      setCreateForm({ username: '', password: '', role_id: '' });
      setShowCreateForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user.', { id: loadingToast });
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Open Edit Modal ───────────────────────────────────────────
  const openEdit = (user) => {
    const role = roles.find(r => r.name === user.role);
    setEditingUser(user);
    setEditForm({ role_id: role?.id || '', is_active: user.is_active });
  };

  // ── Save Edit ─────────────────────────────────────────────────
  const handleEditSave = async () => {
    setEditLoading(true);
    const loadingToast = toast.loading('Saving changes...');
    try {
      await axiosInstance.put(`/admin/users/${editingUser.id}`, {
        role_id: parseInt(editForm.role_id),
        is_active: parseInt(editForm.is_active),
      });
      toast.success(`User "${editingUser.username}" updated.`, { id: loadingToast });
      setEditingUser(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user.', { id: loadingToast });
    } finally {
      setEditLoading(false);
    }
  };

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginated  = users.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-gray-500">Loading users...</span>
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create, edit, and deactivate system users</p>
        </div>
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(null); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {showCreateForm ? '✕ Cancel' : '+ New User'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-bold text-indigo-800 mb-4 uppercase tracking-wide">Create New User</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={createForm.username}
                onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="e.g. john_doe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={createForm.password}
                onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Min. 6 characters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select
                required
                value={createForm.role_id}
                onChange={e => setCreateForm({ ...createForm, role_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Select a role...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={createLoading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {createLoading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.length === 0 && (
              <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No users found.</td></tr>
            )}
            {paginated.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{u.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="uppercase text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  {u.is_active
                    ? <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-100 text-xs font-semibold px-2.5 py-1 rounded-full">● Active</span>
                    : <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 border border-red-100 text-xs font-semibold px-2.5 py-1 rounded-full">● Inactive</span>
                  }
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openEdit(u)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Edit User</h3>
            <p className="text-sm text-gray-500 mb-5">
              Modifying: <span className="font-semibold text-indigo-600">@{editingUser.username}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editForm.role_id}
                  onChange={e => setEditForm({ ...editForm, role_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Account Status</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${editForm.is_active == 1 ? 'bg-green-50 border-green-400 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="is_active"
                      value="1"
                      checked={parseInt(editForm.is_active) === 1}
                      onChange={() => setEditForm({ ...editForm, is_active: 1 })}
                      className="hidden"
                    />
                    ● Active
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${editForm.is_active == 0 ? 'bg-red-50 border-red-400 text-red-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="is_active"
                      value="0"
                      checked={parseInt(editForm.is_active) === 0}
                      onChange={() => setEditForm({ ...editForm, is_active: 0 })}
                      className="hidden"
                    />
                    ● Inactive
                  </label>
                </div>
              </div>

            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
