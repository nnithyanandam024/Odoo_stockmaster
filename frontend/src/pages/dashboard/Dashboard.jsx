import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  PackageX,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import Loading from '../../components/Loading';
import { operationsAPI, productAPI } from '../../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentOperations, setRecentOperations] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, operationsRes, lowStockRes] = await Promise.all([
        operationsAPI.getDashboardStats(),
        operationsAPI.getAll(),
        productAPI.getLowStock()
      ]);

      setStats(statsRes.data);
      setRecentOperations(operationsRes.data);
      setLowStockItems(lowStockRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-gray',
      waiting: 'badge-warning',
      ready: 'badge-info',
      done: 'badge-success',
      canceled: 'badge-danger'
    };
    return badges[status] || 'badge-gray';
  };

  const getTypeBadge = (type) => {
    const badges = {
      receipt: { class: 'badge-success', icon: <TrendingUp size={12} /> },
      delivery: { class: 'badge-info', icon: <TrendingDown size={12} /> },
      transfer: { class: 'badge-warning', icon: <ArrowLeftRight size={12} /> },
      adjustment: { class: 'badge-gray', icon: null }
    };
    return badges[type] || { class: 'badge-gray', icon: null };
  };

  const filteredOperations = recentOperations.filter(op => {
    if (filters.type !== 'all' && op.type !== filters.type) return false;
    if (filters.status !== 'all' && op.status !== filters.status) return false;
    return true;
  });

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          Welcome back! Here's your inventory overview.
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          icon={<Package size={24} />}
          value={stats?.totalProducts || 0}
          label="Total Products"
          color="purple"
        />
        <StatsCard
          icon={<AlertTriangle size={24} />}
          value={stats?.lowStockItems || 0}
          label="Low Stock Items"
          color="yellow"
        />
        <StatsCard
          icon={<PackageX size={24} />}
          value={stats?.outOfStockItems || 0}
          label="Out of Stock"
          color="red"
        />
        <StatsCard
          icon={<ArrowDownToLine size={24} />}
          value={stats?.pendingReceipts || 0}
          label="Pending Receipts"
          color="green"
        />
        <StatsCard
          icon={<ArrowUpFromLine size={24} />}
          value={stats?.pendingDeliveries || 0}
          label="Pending Deliveries"
          color="blue"
        />
        <StatsCard
          icon={<ArrowLeftRight size={24} />}
          value={stats?.scheduledTransfers || 0}
          label="Scheduled Transfers"
          color="purple"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Recent Operations */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Operations</h3>
            <Link to="/operations/history" className="link" style={{ fontSize: '14px' }}>
              View All →
            </Link>
          </div>

          {/* Filters */}
          <div className="filters-bar">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="receipt">Receipts</option>
              <option value="delivery">Deliveries</option>
              <option value="transfer">Transfers</option>
              <option value="adjustment">Adjustments</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperations.slice(0, 5).map((op) => (
                  <tr key={op.id}>
                    <td>
                      <span className={`badge ${getTypeBadge(op.type).class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {getTypeBadge(op.type).icon}
                        {op.type.charAt(0).toUpperCase() + op.type.slice(1)}
                      </span>
                    </td>
                    <td>{op.productName}</td>
                    <td>
                      <span style={{ color: op.type === 'receipt' ? '#10b981' : op.type === 'delivery' ? '#ef4444' : '#6b7280' }}>
                        {op.type === 'receipt' ? '+' : op.type === 'delivery' ? '-' : ''}{op.quantity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(op.status)}`}>
                        {op.status.charAt(0).toUpperCase() + op.status.slice(1)}
                      </span>
                    </td>
                    <td>{op.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚠️ Low Stock Alerts</h3>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="empty-state">
              <p>No low stock items</p>
            </div>
          ) : (
            <div>
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', color: '#374151' }}>{item.name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{item.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: item.stock === 0 ? '#ef4444' : '#f59e0b' 
                    }}>
                      {item.stock} / {item.minStock}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {item.stock === 0 ? 'Out of stock' : 'Low stock'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link 
            to="/products" 
            className="btn btn-secondary btn-block" 
            style={{ marginTop: '16px', textDecoration: 'none' }}
          >
            View All Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
