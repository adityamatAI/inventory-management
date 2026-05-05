import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-indigo-700 text-white shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold tracking-tight">SMART STOCK</Link>
        <div className="flex items-center gap-6">
          {user && (
            <>
              <span className="text-indigo-200 text-sm">
                Role: <span className="text-white font-bold uppercase">{user.role}</span>
              </span>
              {user.role === 'staff' && (
                <Link to="/staff" className="hover:text-indigo-200 transition-colors">Inventory</Link>
              )}
              {user.role === 'manager' && (
                <Link to="/manager" className="hover:text-indigo-200 transition-colors">Requests</Link>
              )}
              {user.role === 'supplier' && (
                <Link to="/supplier" className="hover:text-indigo-200 transition-colors">Portal</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="hover:text-indigo-200 transition-colors">Admin Panel</Link>
              )}
              <button
                onClick={logout}
                className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded transition-colors text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
