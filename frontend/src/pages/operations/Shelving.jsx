import React, { useState, useEffect } from 'react';
import { Package, Check, MapPin, Search, ArrowRight } from 'lucide-react';
import Loading from '../../components/Loading.jsx';
import Modal from '../../components/Modal.jsx';
import { operationsAPI, warehouseAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const Shelving = () => {
  const [loading, setLoading] = useState(true);
  const [shelvingTasks, setShelvingTasks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('pending');
  const [assignedLocation, setAssignedLocation] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [shelvingRes, warehousesRes] = await Promise.all([
        operationsAPI.getShelvingTasks(),
        warehouseAPI.getAll()
      ]);
      setShelvingTasks(shelvingRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      toast.error('Failed to fetch shelving tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStartShelving = (task) => {
    setSelectedTask(task);
    setAssignedLocation(task.suggestedLocation || '');
    setModalOpen(true);
  };

  const handleCompleteShelving = async () => {
    if (!assignedLocation) {
      toast.error('Please assign a location');
      return;
    }

    try {
      await operationsAPI.completeShelving(selectedTask.id, assignedLocation);
      setShelvingTasks(shelvingTasks.map(t => 
        t.id === selectedTask.id 
          ? { ...t, status: 'shelved', assignedLocation, shelvedAt: new Date().toISOString() } 
          : t
      ));
      toast.success('Item shelved successfully!');
      setModalOpen(false);
      setSelectedTask(null);
      setAssignedLocation('');
    } catch (error) {
      toast.error('Failed to complete shelving');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      shelving: 'badge-info',
      shelved: 'badge-success'
    };
    return badges[status] || 'badge-gray';
  };

  const filteredTasks = shelvingTasks.filter(task => {
    const matchesSearch = task.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || task.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Location options for shelving
  const locationOptions = [
    'Rack A - Shelf 1',
    'Rack A - Shelf 2',
    'Rack A - Shelf 3',
    'Rack B - Shelf 1',
    'Rack B - Shelf 2',
    'Rack B - Shelf 3',
    'Rack C - Shelf 1',
    'Rack C - Shelf 2',
    'Rack C - Shelf 3',
    'Floor Storage - Zone A',
    'Floor Storage - Zone B',
    'Cold Storage - Unit 1',
    'Cold Storage - Unit 2'
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🗄️ Shelving Tasks</h1>
        <div className="badge badge-warning" style={{ fontSize: '14px', padding: '8px 16px' }}>
          {shelvingTasks.filter(t => t.status === 'pending').length} Items to Shelve
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', marginBottom: '20px' }}>
        <p style={{ margin: 0, color: '#92400e' }}>
          <strong>🗄️ Shelving Instructions:</strong> Place received items in their designated locations and confirm placement. This updates the inventory location tracking.
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
            <option value="shelved">Completed</option>
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <Package size={64} />
            <h3>No shelving tasks</h3>
            <p>All received items have been shelved</p>
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
                  background: task.status === 'pending' ? '#fffbeb' : task.status === 'shelved' ? '#f0fdf4' : 'white'
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
                    <Package size={16} style={{ color: '#6b7280' }} />
                    <span><strong>Quantity:</strong> {task.quantity} {task.unit}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <span><strong>Receipt ID:</strong> {task.receiptId}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <span><strong>Supplier:</strong> {task.supplier}</span>
                  </div>
                  
                  {task.suggestedLocation && task.status === 'pending' && (
                    <div style={{ 
                      background: '#dbeafe', 
                      padding: '8px 12px', 
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px'
                    }}>
                      <MapPin size={14} />
                      <span><strong>Suggested:</strong> {task.suggestedLocation}</span>
                    </div>
                  )}
                  
                  {task.status === 'shelved' && (
                    <div style={{ 
                      background: '#d1fae5', 
                      padding: '8px 12px', 
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px'
                    }}>
                      <MapPin size={14} />
                      <span><strong>Placed at:</strong> {task.assignedLocation}</span>
                    </div>
                  )}
                </div>

                {task.status === 'pending' && (
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => handleStartShelving(task)}
                  >
                    <ArrowRight size={18} />
                    Assign Location
                  </button>
                )}

                {task.status === 'shelved' && (
                  <div style={{ textAlign: 'center', color: '#10b981', fontSize: '14px' }}>
                    ✅ Shelved at {new Date(task.shelvedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shelving Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedTask(null); setAssignedLocation(''); }}
        title="Assign Shelf Location"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); setSelectedTask(null); }}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={handleCompleteShelving}>
              <Check size={18} />
              Confirm Shelving
            </button>
          </>
        }
      >
        {selectedTask && (
          <div>
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>{selectedTask.productName}</h4>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div><strong>SKU:</strong> {selectedTask.sku}</div>
                <div><strong>Quantity:</strong> {selectedTask.quantity} {selectedTask.unit}</div>
                <div><strong>From Receipt:</strong> {selectedTask.receiptId}</div>
              </div>
            </div>

            <div className="form-group">
              <label>Select Location *</label>
              <select 
                value={assignedLocation} 
                onChange={(e) => setAssignedLocation(e.target.value)}
                required
              >
                <option value="">Choose a location...</option>
                {locationOptions.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {selectedTask.suggestedLocation && (
              <div style={{ 
                background: '#dbeafe', 
                padding: '12px', 
                borderRadius: '8px', 
                fontSize: '14px',
                marginTop: '12px'
              }}>
                <strong>💡 Suggested Location:</strong> {selectedTask.suggestedLocation}
                <button 
                  className="btn btn-secondary" 
                  style={{ marginLeft: '12px', padding: '4px 12px', fontSize: '12px' }}
                  onClick={() => setAssignedLocation(selectedTask.suggestedLocation)}
                >
                  Use This
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Shelving;