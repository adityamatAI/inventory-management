import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Page Imports
import StaffDashboard from './pages/staff/Dashboard';
import StockDeduct from './pages/staff/StockDeduct';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

const Unauthorized = () => (
  <div className="p-10 text-center">
    <div className="text-5xl mb-4">🚫</div>
    <h1 className="text-2xl font-bold text-red-600 mb-2">403 — Unauthorized</h1>
    <p className="text-gray-500 text-sm">You don't have permission to access this page.</p>
  </div>
);

// Helper: wraps a page with both ProtectedRoute and ErrorBoundary
const Protected = ({ roles, children }) => (
  <ErrorBoundary>
    <ProtectedRoute allowedRoles={roles}>
      {children}
    </ProtectedRoute>
  </ErrorBoundary>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<AppLayout />}>
        {/* Landing — any authenticated role */}
        <Route
          path="/"
          element={
            <Protected roles={['admin', 'manager', 'staff', 'supplier']}>
              <p className="text-center p-10 text-gray-500">Welcome to Smart Stock. Select a dashboard from the menu.</p>
            </Protected>
          }
        />

        {/* Staff */}
        <Route path="/staff" element={<Protected roles={['staff']}><StaffDashboard /></Protected>} />
        <Route path="/staff/deduct/:id" element={<Protected roles={['staff']}><StockDeduct /></Protected>} />

        {/* Supplier */}
        <Route path="/supplier" element={<Protected roles={['supplier']}><SupplierDashboard /></Protected>} />

        {/* Manager */}
        <Route path="/manager" element={<Protected roles={['manager']}><ManagerDashboard /></Protected>} />

        {/* Admin */}
        <Route path="/admin" element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />
      </Route>
    </Routes>
  );
}

export default App;