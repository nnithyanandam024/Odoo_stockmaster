import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, Check, AlertTriangle, Search } from 'lucide-react';
import Loading from '../../components/Loading.jsx';
import Modal from '../../components/Modal.jsx';
import { operationsAPI, productAPI, warehouseAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const StockCounting = () => {
  const [loading, setLoading] = useState(true);
  const [countingSessions, setCountingSessions] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [countingModalOpen, setCountingModalOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    name: '',
    warehouse: '',
    category: 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, productsRes, warehousesRes] = await Promise.all([
        operationsAPI.getCountingSessions(),
        productAPI.getAll(),
        warehouseAPI.getAll()
      ]);
      setCountingSessions(sessionsRes.data);
      setProducts(productsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.name || !newSession.warehouse) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await operationsAPI.createCountingSession(newSession);
      setCountingSessions([response.data, ...countingSessions]);
      toast.success('Counting session created');
      setModalOpen(false);
      setNewSession({ name: '', warehouse: '', category: 'all' });
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  const handleStartCounting = (session) => {
    setActiveSession(session);
    setCountingModalOpen(true);
  };

  const handleUpdateCount = (productId, countedQty) => {
    setActiveSession(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, countedQuantity: parseInt(countedQty) || 0, counted: true }
          : item
      )
    }));
  };

  const handleSaveCounts = async () => {
    try {
      await operationsAPI.saveCountingSession(activeSession.id, activeSession.items);
      
      // Calculate discrepancies
      const discrepancies = activeSession.items.filter(
        item => item.counted && item.countedQuantity !== item.systemQuantity
      );

      setCountingSessions(countingSessions.map(s =>
        s.id === activeSession.id
          ? { ...s, status: 'completed', discrepancies: discrepancies.length, completedAt: new Date().toISOString() }
          : s
      ));

      toast.success(`Counting saved! ${discrepancies.length} discrepancies found.`);
      setCountingModalOpen(false);
      setActiveSession(null);
    } catch (error) {
      toast.error('Failed to save counts');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-gray',
      'in-progress': 'badge-warning',
      completed: 'badge-success',
      applied: 'badge-info'
    };
    return badges[status] || 'badge-gray';
  };

  const categories = [...new Set(products.map(p => p.category))];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Stock Counting</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={20} />
          New Count Session
        </button>
      </div>

      {/* Info Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', marginBottom: '20px' }}>
        <p style={{ margin: 0, color: '#7c3aed' }}>
          <strong>📋 Stock Counting:</strong> Create counting sessions to perform physical inventory counts. Any discrepancies between system stock and physical count will be flagged for review and adjustment.
        </p>
      </div>

      {/* Sessions List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Counting Sessions</h3>
        </div>

        {countingSessions.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={64} />
            <h3>No counting sessions</h3>
            <p>Create a new session to start physical stock counting</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Session Name</th>
                  <th>Warehouse</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Discrepancies</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {countingSessions.map((session) => (
                  <tr key={session.id}>
                    <td style={{ fontWeight: '500' }}>{session.name}</td>
                    <td>{session.warehouse}</td>
                    <td>{session.itemCount} items</td>
                    <td>
                      <span className={`badge ${getStatusBadge(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>
                      {session.discrepancies > 0 ? (
                        <span style={{ color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} />
                          {session.discrepancies} found
                        </span>
                      ) : session.status === 'completed' ? (
                        <span style={{ color: '#10b981' }}>✓ None</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{session.createdAt}</td>
                    <td>
                      {session.status !== 'completed' && session.status !== 'applied' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => handleStartCounting(session)}
                        >
                          {session.status === 'draft' ? 'Start Counting' : 'Continue'}
                        </button>
                      )}
                      {session.status === 'completed' && session.discrepancies > 0 && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                        >
                          Apply Adjustments
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Counting Session"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateSession}>
              Create Session
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Session Name *</label>
          <input
            type="text"
            value={newSession.name}
            onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
            placeholder="e.g., Monthly Count - November 2024"
            required
          />
        </div>
        <div className="form-group">
          <label>Warehouse *</label>
          <select
            value={newSession.warehouse}
            onChange={(e) => setNewSession({ ...newSession, warehouse: e.target.value })}
            required
          >
            <option value="">Select Warehouse</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.name}>{wh.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Category (Optional)</label>
          <select
            value={newSession.category}
            onChange={(e) => setNewSession({ ...newSession, category: e.target.value })}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Counting Modal */}
      <Modal
        isOpen={countingModalOpen}
        onClose={() => { setCountingModalOpen(false); setActiveSession(null); }}
        title={`Counting: ${activeSession?.name || ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setCountingModalOpen(false); setActiveSession(null); }}>
              Save & Exit
            </button>
            <button className="btn btn-success" onClick={handleSaveCounts}>
              <Check size={18} />
              Complete Counting
            </button>
          </>
        }
      >
        {activeSession && (
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {activeSession.items?.filter(i => i.counted).length || 0} / {activeSession.items?.length || 0} counted
              </span>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                Warehouse: {activeSession.warehouse}
              </span>
            </div>

            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {activeSession.items?.map((item) => {
                const diff = item.counted ? item.countedQuantity - item.systemQuantity : null;
                return (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderBottom: '1px solid #e5e7eb',
                      background: item.counted ? (diff === 0 ? '#f0fdf4' : '#fef2f2') : 'white'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{item.productName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {item.sku} • Location: {item.location}
                      </div>
                      <div style={{ fontSize: '13px', marginTop: '4px' }}>
                        System: <strong>{item.systemQuantity}</strong> {item.unit}
                      </div>
                    </div>
                    <div style={{ width: '120px' }}>
                      <input
                        type="number"
                        value={item.countedQuantity ?? ''}
                        onChange={(e) => handleUpdateCount(item.productId, e.target.value)}
                        placeholder="Count"
                        style={{ width: '100%' }}
                        min="0"
                      />
                    </div>
                    {item.counted && (
                      <div style={{ width: '80px', textAlign: 'right' }}>
                        {diff === 0 ? (
                          <span style={{ color: '#10b981' }}>✓ Match</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: '600' }}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockCounting;