import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ClipboardEdit,
  History,
  Settings,
  User,
  LogOut,
  X,
  Warehouse,
  PackageSearch,
  Box,
  FileText,
  ClipboardList
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  
  // Get current user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'staff';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Role-based access configuration
  const roleAccess = {
    admin: ['all'], // Admin can access everything
    manager: ['dashboard', 'products', 'receipts', 'deliveries', 'transfers', 'adjustments', 'history', 'ledger', 'counting', 'settings', 'profile'],
    staff: ['dashboard', 'picking', 'packing', 'shelving', 'counting', 'profile'] // Staff limited access
  };

  const canAccess = (page) => {
    if (roleAccess[userRole]?.includes('all')) return true;
    return roleAccess[userRole]?.includes(page);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>📦 StockMaster</h1>
          <button className="modal-close mobile-only" onClick={onClose} style={{ display: 'none' }}>
            <X size={20} />
          </button>
        </div>
        {/* User Info */}
        <div style={{ 
          marginTop: '12px', 
          padding: '10px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <div style={{ fontWeight: '500' }}>{user.name || 'User'}</div>
          <div style={{ 
            display: 'inline-block',
            marginTop: '4px',
            padding: '2px 8px',
            background: userRole === 'admin' ? '#ef4444' : userRole === 'manager' ? '#f59e0b' : '#0ea5e9',
            borderRadius: '4px',
            fontSize: '11px',
            textTransform: 'uppercase'
          }}>
            {userRole}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* Dashboard - Everyone */}
        <div className="nav-section">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
        </div>

        {/* Products - Manager & Admin only */}
        {canAccess('products') && (
          <div className="nav-section">
            <div className="nav-section-title">Products</div>
            <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Package size={20} />
              All Products
            </NavLink>
          </div>
        )}

        {/* Warehouse Tasks - Staff */}
        {canAccess('picking') && (
          <div className="nav-section">
            <div className="nav-section-title">Warehouse Tasks</div>
            <NavLink to="/operations/picking" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <PackageSearch size={20} />
              Picking
            </NavLink>
            <NavLink to="/operations/packing" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Box size={20} />
              Packing
            </NavLink>
            <NavLink to="/operations/shelving" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Warehouse size={20} />
              Shelving
            </NavLink>
          </div>
        )}

        {/* Operations - Manager & Admin */}
        {canAccess('receipts') && (
          <div className="nav-section">
            <div className="nav-section-title">Operations</div>
            <NavLink to="/operations/receipts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ArrowDownToLine size={20} />
              Receipts
            </NavLink>
            <NavLink to="/operations/deliveries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ArrowUpFromLine size={20} />
              Deliveries
            </NavLink>
            <NavLink to="/operations/transfers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ArrowLeftRight size={20} />
              Internal Transfers
            </NavLink>
            <NavLink to="/operations/adjustments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ClipboardEdit size={20} />
              Adjustments
            </NavLink>
          </div>
        )}

        {/* Inventory - Manager & Admin + Stock Counting for Staff */}
        <div className="nav-section">
          <div className="nav-section-title">Inventory</div>
          {canAccess('counting') && (
            <NavLink to="/operations/counting" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ClipboardList size={20} />
              Stock Counting
            </NavLink>
          )}
          {canAccess('history') && (
            <NavLink to="/operations/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <History size={20} />
              Move History
            </NavLink>
          )}
          {canAccess('ledger') && (
            <NavLink to="/operations/ledger" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileText size={20} />
              Stock Ledger
            </NavLink>
          )}
        </div>

        {/* Settings - Manager & Admin */}
        {canAccess('settings') && (
          <div className="nav-section">
            <div className="nav-section-title">Settings</div>
            <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={20} />
              Warehouse
            </NavLink>
          </div>
        )}

        {/* Profile - Everyone */}
        <div className="nav-section">
          <div className="nav-section-title">Profile</div>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User size={20} />
            My Profile
          </NavLink>
          <button className="nav-link" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;