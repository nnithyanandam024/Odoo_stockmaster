import React, { useState, useEffect } from 'react';
import { Search, History, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, ClipboardEdit } from 'lucide-react';
import Loading from '../../components/Loading';
import { operationsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MoveHistory = () => {
  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const response = await operationsAPI.getAll();
      setOperations(response.data);
    } catch (error) {
      toast.error('Failed to fetch operations');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      receipt: <ArrowDownToLine size={16} />,
      delivery: <ArrowUpFromLine size={16} />,
      transfer: <ArrowLeftRight size={16} />,
      adjustment: <ClipboardEdit size={16} />
    };
    return icons[type] || null;
  };

  const getTypeBadgeClass = (type) => {
    const classes = {
      receipt: 'badge-success',
      delivery: 'badge-info',
      transfer: 'badge-warning',
      adjustment: 'badge-gray'
    };
    return classes[type] || 'badge-gray';
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

  const getQuantityDisplay = (op) => {
    if (op.type === 'receipt') return { text: `+${op.quantity}`, color: '#10b981' };
    if (op.type === 'delivery') return { text: `-${op.quantity}`, color: '#ef4444' };
    if (op.type === 'adjustment') {
      if (op.quantity > 0) return { text: `+${op.quantity}`, color: '#10b981' };
      if (op.quantity < 0) return { text: `${op.quantity}`, color: '#ef4444' };
      return { text: '0', color: '#6b7280' };
    }
    return { text: op.quantity, color: '#6b7280' };
  };

  const getDetails = (op) => {
    switch (op.type) {
      case 'receipt':
        return op.supplier ? `From: ${op.supplier}` : '-';
      case 'delivery':
        return op.customer ? `To: ${op.customer}` : '-';
      case 'transfer':
        return `${op.fromLocation} → ${op.toLocation}`;
      case 'adjustment':
        return op.notes || '-';
      default:
        return '-';
    }
  };

  // Filter operations
  const filteredOperations = operations.filter(op => {
    const matchesSearch = op.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filters.type === 'all' || op.type === filters.type;
    const matchesStatus = filters.status === 'all' || op.status === filters.status;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📜 Move History</h1>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="filters-bar">
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%' }}
            />
          </div>
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

        {filteredOperations.length === 0 ? (
          <div className="empty-state">
            <History size={64} />
            <h3>No operations found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperations.map((op) => {
                  const qty = getQuantityDisplay(op);
                  return (
                    <tr key={op.id}>
                      <td>
                        <code>
                          {op.type === 'receipt' && 'RCP'}
                          {op.type === 'delivery' && 'DLV'}
                          {op.type === 'transfer' && 'TRF'}
                          {op.type === 'adjustment' && 'ADJ'}
                          -{op.id}
                        </code>
                      </td>
                      <td>
                        <span 
                          className={`badge ${getTypeBadgeClass(op.type)}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {getTypeIcon(op.type)}
                          {op.type.charAt(0).toUpperCase() + op.type.slice(1)}
                        </span>
                      </td>
                      <td style={{ fontWeight: '500' }}>{op.productName}</td>
                      <td style={{ fontWeight: '600', color: qty.color }}>
                        {qty.text}
                      </td>
                      <td style={{ color: '#6b7280', fontSize: '13px' }}>
                        {getDetails(op)}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(op.status)}`}>
                          {op.status}
                        </span>
                      </td>
                      <td>{op.createdAt}</td>
                      <td>{op.completedAt || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: '#f9fafb', 
          borderRadius: '8px',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div>
            <span style={{ color: '#6b7280' }}>Total Operations: </span>
            <strong>{filteredOperations.length}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Receipts: </span>
            <strong style={{ color: '#10b981' }}>
              {filteredOperations.filter(o => o.type === 'receipt').length}
            </strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Deliveries: </span>
            <strong style={{ color: '#0ea5e9' }}>
              {filteredOperations.filter(o => o.type === 'delivery').length}
            </strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Transfers: </span>
            <strong style={{ color: '#f59e0b' }}>
              {filteredOperations.filter(o => o.type === 'transfer').length}
            </strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Adjustments: </span>
            <strong>
              {filteredOperations.filter(o => o.type === 'adjustment').length}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveHistory;