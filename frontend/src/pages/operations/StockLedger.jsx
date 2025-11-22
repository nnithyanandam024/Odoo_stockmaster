import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import Loading from '../../components/Loading.jsx';
import { operationsAPI, productAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const StockLedger = () => {
  const [loading, setLoading] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    product: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ledgerRes, productsRes] = await Promise.all([
        operationsAPI.getStockLedger(),
        productAPI.getAll()
      ]);
      setLedgerEntries(ledgerRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to fetch stock ledger');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'receipt': return <TrendingUp size={16} style={{ color: '#10b981' }} />;
      case 'delivery': return <TrendingDown size={16} style={{ color: '#ef4444' }} />;
      case 'transfer': return <ArrowLeftRight size={16} style={{ color: '#f59e0b' }} />;
      case 'adjustment': return <FileText size={16} style={{ color: '#6b7280' }} />;
      default: return null;
    }
  };

  const getTypeBadge = (type) => {
    const badges = {
      receipt: 'badge-success',
      delivery: 'badge-danger',
      transfer: 'badge-warning',
      adjustment: 'badge-gray',
      'opening-stock': 'badge-info'
    };
    return badges[type] || 'badge-gray';
  };

  const handleExport = () => {
    // Simulate CSV export
    const headers = ['Date', 'Product', 'SKU', 'Type', 'Reference', 'In', 'Out', 'Balance', 'Location', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        entry.date,
        `"${entry.productName}"`,
        entry.sku,
        entry.type,
        entry.reference,
        entry.quantityIn || 0,
        entry.quantityOut || 0,
        entry.balance,
        `"${entry.location}"`,
        `"${entry.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Ledger exported to CSV');
  };

  // Filter entries
  const filteredEntries = ledgerEntries.filter(entry => {
    const matchesSearch = entry.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = filters.product === 'all' || entry.productId === filters.product;
    const matchesType = filters.type === 'all' || entry.type === filters.type;
    return matchesSearch && matchesProduct && matchesType;
  });

  // Calculate summary
  const summary = {
    totalIn: filteredEntries.reduce((sum, e) => sum + (e.quantityIn || 0), 0),
    totalOut: filteredEntries.reduce((sum, e) => sum + (e.quantityOut || 0), 0),
    netChange: filteredEntries.reduce((sum, e) => sum + (e.quantityIn || 0) - (e.quantityOut || 0), 0)
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📒 Stock Ledger</h1>
        <button className="btn btn-secondary" onClick={handleExport}>
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Stock In</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>+{summary.totalIn}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Stock Out</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>-{summary.totalOut}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Net Change</div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: summary.netChange >= 0 ? '#10b981' : '#ef4444' 
          }}>
            {summary.netChange >= 0 ? '+' : ''}{summary.netChange}
          </div>
        </div>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="filters-bar">
          <div style={{ position: 'relative', flex: 1, maxWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%' }}
            />
          </div>
          <select
            value={filters.product}
            onChange={(e) => setFilters({ ...filters, product: e.target.value })}
          >
            <option value="all">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="all">All Types</option>
            <option value="opening-stock">Opening Stock</option>
            <option value="receipt">Receipt</option>
            <option value="delivery">Delivery</option>
            <option value="transfer">Transfer</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            style={{ minWidth: '140px' }}
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            style={{ minWidth: '140px' }}
          />
        </div>

        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <FileText size={64} />
            <h3>No ledger entries found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right' }}>In</th>
                  <th style={{ textAlign: 'right' }}>Out</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                  <th>Location</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr key={entry.id || index}>
                    <td>
                      <div style={{ fontSize: '14px' }}>{entry.date}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{entry.time}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{entry.productName}</div>
                      <code style={{ fontSize: '11px', color: '#6b7280' }}>{entry.sku}</code>
                    </td>
                    <td>
                      <span 
                        className={`badge ${getTypeBadge(entry.type)}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {getTypeIcon(entry.type)}
                        {entry.type}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px' }}>{entry.reference}</code>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {entry.quantityIn ? (
                        <span style={{ color: '#10b981', fontWeight: '600' }}>+{entry.quantityIn}</span>
                      ) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {entry.quantityOut ? (
                        <span style={{ color: '#ef4444', fontWeight: '600' }}>-{entry.quantityOut}</span>
                      ) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                      {entry.balance}
                    </td>
                    <td style={{ fontSize: '13px' }}>{entry.location}</td>
                    <td style={{ fontSize: '13px', color: '#6b7280', maxWidth: '150px' }}>
                      {entry.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination placeholder */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '16px',
          padding: '12px 0',
          borderTop: '1px solid #e5e7eb'
        }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Showing {filteredEntries.length} entries
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" disabled style={{ padding: '6px 12px' }}>Previous</button>
            <button className="btn btn-secondary" disabled style={{ padding: '6px 12px' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockLedger;