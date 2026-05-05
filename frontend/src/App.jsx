import React from 'react';
import { Routes, Route, Outlet, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Real Page Imports
import StaffDashboard from './pages/staff/Dashboard';
import StockDeduct from './pages/staff/StockDeduct';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard'; // We will create this next
import AdminDashboard from './pages/admin/AdminDashboard'; // We will create this next

function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white shadow-lg p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold tracking-tight">SMART STOCK</Link>
          <div className="flex items-center gap-6">
            {user && (
              <>
                <span className="text-indigo-200 text-sm">Role: <span className="text-white font-bold uppercase">{user.role}</span></span>
                {user.role === 'staff' && <Link to="/staff" className="hover:text-indigo-200">Inventory</Link>}
                {user.role === 'manager' && <Link to="/manager" className="hover:text-indigo-200">Requests</Link>}
                {user.role === 'supplier' && <Link to="/supplier" className="hover:text-indigo-200">Portal</Link>}
                {user.role === 'admin' && <Link to="/admin" className="hover:text-indigo-200">Admin Panel</Link>}
                <button onClick={logout} className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded transition-colors text-sm">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

const Unauthorized = () => <div className="p-10 text-center text-red-600 font-bold">403 - Unauthorized Access</div>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route element={<AppLayout />}>
        <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff', 'supplier']}><p className="text-center p-10 text-gray-500">Welcome to Smart Stock. Select a dashboard from the menu.</p></ProtectedRoute>} />
        
        {/* Staff Routes */}
        <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff/deduct/:id" element={<ProtectedRoute allowedRoles={['staff']}><StockDeduct /></ProtectedRoute>} />
        
        {/* Supplier Routes */}
        <Route path="/supplier" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierDashboard /></ProtectedRoute>} />
        
        {/* Manager Routes */}
        <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;