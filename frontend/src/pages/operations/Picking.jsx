import React, { useState, useEffect } from 'react';
import { Package, Check, MapPin, Search } from 'lucide-react';
import Loading from '../../components/Loading.jsx';
import Modal from '../../components/Modal.jsx';
import { operationsAPI, productAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const Picking = () => {
  const [loading, setLoading] = useState(true);
  const [pickingTasks, setPickingTasks] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [operationsRes, productsRes] = await Promise.all([
        operationsAPI.getPickingTasks(),
        productAPI.getAll()
      ]);
      setPickingTasks(operationsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to fetch picking tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPicking = (task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleCompletePicking = async () => {
    try {
      await operationsAPI.completePicking(selectedTask.id);
      setPickingTasks(pickingTasks.map(t => 
        t.id === selectedTask.id ? { ...t, status: 'picked', pickedAt: new Date().toISOString() } : t
      ));
      toast.success('Picking completed! Ready for packing.');
      setModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      toast.error('Failed to complete picking');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      picking: 'badge-info',
      picked: 'badge-success',
      packed: 'badge-success'
    };
    return badges[status] || 'badge-gray';
  };

  const filteredTasks = pickingTasks.filter(task => {
    const matchesSearch = task.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || task.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📦 Picking Tasks</h1>
        <div className="badge badge-info" style={{ fontSize: '14px', padding: '8px 16px' }}>
          {pickingTasks.filter(t => t.status === 'pending').length} Pending Tasks
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', marginBottom: '20px' }}>
        <p style={{ margin: 0, color: '#1e40af' }}>
          <strong>📋 Picking Instructions:</strong> Collect items from their locations and mark as picked when done. Items will then be ready for packing.
        </p>
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
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="picking">In Progress</option>
            <option value="picked">Completed</option>
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <Package size={64} />
            <h3>No picking tasks</h3>
            <p>All items have been picked or no deliveries pending</p>
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
                  background: task.status === 'pending' ? '#fffbeb' : task.status === 'picked' ? '#f0fdf4' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
                      {task.productName}
                    </h4>
                    <code style={{ fontSize: '12px', color: '#6b7280' }}>{task.sku}</code>
                  </div>
                  <span className={`badge ${getStatusBadge(task.status)}`}>
                    {task.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <MapPin size={16} style={{ color: '#6b7280' }} />
                    <span><strong>Location:</strong> {task.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <Package size={16} style={{ color: '#6b7280' }} />
                    <span><strong>Quantity:</strong> {task.quantity} {task.unit}</span>
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    <strong>Order:</strong> {task.orderId}
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    <strong>Customer:</strong> {task.customer}
                  </div>
                </div>

                {task.status === 'pending' && (
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => handleStartPicking(task)}
                  >
                    <Check size={18} />
                    Start Picking
                  </button>
                )}

                {task.status === 'picked' && (
                  <div style={{ textAlign: 'center', color: '#10b981', fontSize: '14px' }}>
                    ✅ Picked at {new Date(task.pickedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Picking Confirmation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedTask(null); }}
        title="Confirm Picking"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); setSelectedTask(null); }}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={handleCompletePicking}>
              <Check size={18} />
              Mark as Picked
            </button>
          </>
        }
      >
        {selectedTask && (
          <div>
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>{selectedTask.productName}</h4>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div><strong>Location:</strong> {selectedTask.location}</div>
                <div><strong>Quantity to Pick:</strong> {selectedTask.quantity} {selectedTask.unit}</div>
                <div><strong>Order ID:</strong> {selectedTask.orderId}</div>
              </div>
            </div>
            
            <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
              <strong>⚠️ Checklist:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Verify product matches SKU</li>
                <li>Count quantity correctly</li>
                <li>Check for damages</li>
                <li>Place in picking cart/bin</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Picking;