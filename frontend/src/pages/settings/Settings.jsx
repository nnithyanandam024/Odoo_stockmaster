import React, { useState, useEffect } from 'react';
import { Plus, Warehouse, Edit, Trash2 } from 'lucide-react';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { warehouseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 1000
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(response.data);
    } catch (error) {
      toast.error('Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await warehouseAPI.create(formData);
      setWarehouses([...warehouses, response.data]);
      toast.success('Warehouse created successfully');
      setModalOpen(false);
      setFormData({ name: '', location: '', capacity: 1000 });
    } catch (error) {
      toast.error('Failed to create warehouse');
    } finally {
      setSaving(false);
    }
  };

  const getCapacityPercentage = (used, capacity) => {
    return Math.round((used / capacity) * 100);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
      </div>

      {/* Warehouses Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Warehouse size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Warehouses
          </h3>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={20} />
            Add Warehouse
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {warehouses.map((warehouse) => {
            const percentage = getCapacityPercentage(warehouse.used, warehouse.capacity);
            return (
              <div
                key={warehouse.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                      {warehouse.name}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>{warehouse.location}</p>
                  </div>
                  <div className="actions">
                    <button className="action-btn edit" title="Edit">
                      <Edit size={14} />
                    </button>
                    <button className="action-btn delete" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: '#6b7280' }}>Capacity Used</span>
                    <span style={{ fontWeight: '500' }}>{warehouse.used} / {warehouse.capacity}</span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    background: '#e5e7eb', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: percentage > 80 ? '#ef4444' : percentage > 60 ? '#f59e0b' : '#10b981',
                      borderRadius: '4px',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {percentage}% used
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Warehouse Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Warehouse"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Creating...' : 'Create Warehouse'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Warehouse Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Warehouse"
              required
            />
          </div>
          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Building A, Floor 1"
              required
            />
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              min="1"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;