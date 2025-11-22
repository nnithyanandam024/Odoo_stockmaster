import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth Pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard.jsx';

// Products
import ProductList from './pages/products/ProductList.jsx';
import ProductForm from './pages/products/ProductForm.jsx';

// Operations
import Receipts from './pages/operations/Receipts.jsx';
import Deliveries from './pages/operations/Deliveries.jsx';
import Transfers from './pages/operations/Transfers.jsx';
import Adjustments from './pages/operations/Adjustments.jsx';
import MoveHistory from './pages/operations/MoveHistory.jsx';

// NEW: Warehouse Staff Operations
import Picking from './pages/operations/Picking.jsx';
import Packing from './pages/operations/Packing.jsx';
import Shelving from './pages/operations/Shelving.jsx';

// NEW: Inventory Management
import StockLedger from './pages/operations/StockLedger.jsx';
import StockCounting from './pages/operations/StockCounting.jsx';

// Settings & Profile
import Settings from './pages/settings/Settings.jsx';
import Profile from './pages/profile/Profile.jsx';

// Layout
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Products */}
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />
          
          {/* Manager Operations */}
          <Route path="operations/receipts" element={<Receipts />} />
          <Route path="operations/deliveries" element={<Deliveries />} />
          <Route path="operations/transfers" element={<Transfers />} />
          <Route path="operations/adjustments" element={<Adjustments />} />
          <Route path="operations/history" element={<MoveHistory />} />
          
          {/* Warehouse Staff Operations */}
          <Route path="operations/picking" element={<Picking />} />
          <Route path="operations/packing" element={<Packing />} />
          <Route path="operations/shelving" element={<Shelving />} />
          
          {/* Inventory Management */}
          <Route path="operations/ledger" element={<StockLedger />} />
          <Route path="operations/counting" element={<StockCounting />} />
          
          {/* Settings & Profile */}
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;