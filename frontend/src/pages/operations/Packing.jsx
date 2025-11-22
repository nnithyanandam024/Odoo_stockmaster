import React, { useState, useEffect } from 'react';
import { Package, Check, Box, Search, Printer } from 'lucide-react';
import Loading from '../../components/Loading.jsx';
import Modal from '../../components/Modal.jsx';
import { operationsAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const Packing = () => {
  const [loading, setLoading] = useState(true);
  const [packingTasks, setPackingTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('pending');
  const [packingDetails, setPackingDetails] = useState({
    boxSize: 'medium',
    weight: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await operationsAPI.getPackingTasks();
      setPackingTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch packing tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPacking = (task) => {
    setSelectedTask(task);
    setPackingDetails({ boxSize: 'medium', weight: '', notes: '' });
    setModalOpen(true);
  };

  const handleCompletePacking = async () => {
    try {
      await operationsAPI.completePacking(selectedTask.id, packingDetails);
      setPackingTasks(packingTasks.map(t => 
        t.id === selectedTask.id 
          ? { ...t, status: 'packed', packedAt: new Date().toISOString(), ...packingDetails } 
          : t
      ));
      toast.success('Packing completed! Ready for shipment.');
      setModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      toast.error('Failed to complete packing');
    }
  };

  const handlePrintLabel = (task) => {
    // Simulate printing label
    toast.success(`Printing shipping label for Order ${task.orderId}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      packing: 'badge-info',
      packed: 'badge-success',
      shipped: 'badge-success'
    };
    return badges[status] || 'badge-gray';
  };

  const filteredTasks = packingTasks.filter(task => {
    const matchesSearch = task.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.orderId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || task.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📦 Packing Station</h1>
        <div className="badge badge-info" style={{ fontSize: '14px', padding: '8px 16px' }}>
          {packingTasks.filter(t => t.status === 'pending').length} Ready to Pack
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', marginBottom: '20px' }}>
        <p style={{ margin: 0, color: '#166534' }}>
          <strong>📦 Packing Instructions:</strong> Pack picked items securely, record box size and weight, then print shipping label.
        </p>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="filters-bar">
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by product or order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%' }}
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Tasks</option>
            <option value="pending">Ready to Pack</option>
            <option value="packed">Packed</option>
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <Box size={64} />
            <h3>No packing tasks</h3>
            <p>All picked items have been packed or waiting for picking</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  background: task.status === 'pending' ? '#fefce8' : task.status === 'packed' ? '#f0fdf4' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
                      Order #{task.orderId}
                    </h4>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{task.customer}</span>
                  </div>
                  <span className={`badge ${getStatusBadge(task.status)}`}>
                    {task.status}
                  </span>
                </div>

                {/* Items in Order */}
                <div style={{ 
                  background: '#f9fafb', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '12px' 
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>Items:</div>
                  {task.items?.map((item, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '13px',
                      padding: '4px 0',
                      borderBottom: idx < task.items.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}>
                      <span>{item.name}</span>
                      <span style={{ fontWeight: '500' }}>x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                  <strong>Shipping Address:</strong>
                  <div style={{ color: '#6b7280', marginTop: '4px' }}>{task.shippingAddress}</div>
                </div>

                {task.status === 'packed' && (
                  <div style={{ 
                    background: '#d1fae5', 
                    padding: '8px 12px', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginBottom: '12px'
                  }}>
                    <div><strong>Box:</strong> {task.boxSize}</div>
                    <div><strong>Weight:</strong> {task.weight} kg</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  {task.status === 'pending' && (
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => handleStartPacking(task)}
                    >
                      <Box size={18} />
                      Pack Order
                    </button>
                  )}

                  {task.status === 'packed' && (
                    <>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => handlePrintLabel(task)}
                      >
                        <Printer size={18} />
                        Print Label
                      </button>
                    </>
                  )}
                </div>

                {task.status === 'packed' && (
                  <div style={{ textAlign: 'center', color: '#10b981', fontSize: '13px', marginTop: '8px' }}>
                    ✅ Packed at {new Date(task.packedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Packing Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedTask(null); }}
        title="Pack Order"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); setSelectedTask(null); }}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={handleCompletePacking}>
              <Check size={18} />
              Complete Packing
            </button>
          </>
        }
      >
        {selectedTask && (
          <div>
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Order #{selectedTask.orderId}</h4>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                <div><strong>Customer:</strong> {selectedTask.customer}</div>
                <div style={{ marginTop: '8px' }}><strong>Items:</strong></div>
                {selectedTask.items?.map((item, idx) => (
                  <div key={idx} style={{ marginLeft: '12px' }}>• {item.name} x{item.quantity}</div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Box Size *</label>
              <select 
                value={packingDetails.boxSize} 
                onChange={(e) => setPackingDetails({ ...packingDetails, boxSize: e.target.value })}
              >
                <option value="small">Small (30x20x15 cm)</option>
                <option value="medium">Medium (45x35x25 cm)</option>
                <option value="large">Large (60x45x35 cm)</option>
                <option value="extra-large">Extra Large (80x60x45 cm)</option>
                <option value="custom">Custom/Envelope</option>
              </select>
            </div>

            <div className="form-group">
              <label>Total Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                value={packingDetails.weight}
                onChange={(e) => setPackingDetails({ ...packingDetails, weight: e.target.value })}
                placeholder="Enter weight"
                required
              />
            </div>

            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={packingDetails.notes}
                onChange={(e) => setPackingDetails({ ...packingDetails, notes: e.target.value })}
                placeholder="e.g., Fragile, Handle with care"
                rows={2}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Packing;