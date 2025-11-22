import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        <button 
          className="btn btn-secondary mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          style={{ display: 'none', marginBottom: '16px' }}
        >
          <Menu size={20} />
        </button>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;