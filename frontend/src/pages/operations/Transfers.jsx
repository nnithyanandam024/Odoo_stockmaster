import React, { useState, useEffect } from 'react';
import { Plus, Check, X, ArrowLeftRight } from 'lucide-react';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { operationsAPI, productAPI, warehouseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Transfers = () => {
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    fromLocation: '',
    toLocation: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transfersRes, productsRes, warehousesRes] = await Promise.all([
        operationsAPI.getAll(),
        productAPI.getAll(),
        warehouseAPI.getAll()
      ]);
      setTransfers(transfersRes.data.filter(op => op.type === 'transfer'));
      setProducts(productsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const product = products.find(p => p.id === e.target.value);
    setFormData({
      ...formData,
      productId: e.target.value,
      productName: product?.name || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.fromLocation === formData.toLocation) {
      toast.error('Source and destination must be different');
      return;
    }

    setSaving(true);

    try {
      const response = await operationsAPI.createTransfer(formData);
      setTransfers([response.data, ...transfers]);
      toast.success('Transfer created successfully');
      setModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create transfer');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      await operationsAPI.validate(id);
      setTransfers(transfers.map(t => t.id === id ? { ...t, status: 'done' } : t));
      toast.success('Transfer completed!');
    } catch (error) {
      toast.error('Failed to validate');
    }
  };

  const handleCancel = async (id) => {
    try {
      await operationsAPI.cancel(id);
      setTransfers(transfers.map(t => t.id === id ? { ...t, status: 'canceled' } : t));
      toast.success('Transfer canceled');
    } catch (error) {
      toast.error('Failed to cancel');
    }
  };

  const resetForm = () => {
    setFormData({ productId: '', productName: '', quantity: 1, fromLocation: '', toLocation: '' });
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

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔄 Internal Transfers</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={20} />
          New Transfer
        </button>
      </div>

      <div className="card">
        {transfers.length === 0 ? (
          <div className="empty-state">
            <ArrowLeftRight size={64} />
            <h3>No transfers yet</h3>
            <p>Create internal transfers to move stock between locations</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td><code>TRF-{transfer.id}</code></td>
                    <td>{transfer.productName}</td>
                    <td>{transfer.quantity}</td>
                    <td>{transfer.fromLocation}</td>
                    <td>{transfer.toLocation}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(transfer.status)}`}>
                        {transfer.status}
                      </span>
                    </td>
                    <td>{transfer.createdAt}</td>
                    <td>
                      {transfer.status !== 'done' && transfer.status !== 'canceled' && (
                        <div className="actions">
                          <button
                            className="action-btn edit"
                            onClick={() => handleValidate(transfer.id)}
                            title="Complete"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleCancel(transfer.id)}
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Transfer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="New Internal Transfer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Creating...' : 'Create Transfer'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product *</label>
            <select value={formData.productId} onChange={handleProductChange} required>
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantity *</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              min="1"
              required
            />
          </div>
          <div className="form-group">
            <label>From Location *</label>
            <select
              value={formData.fromLocation}
              onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
              required
            >
              <option value="">Select Source</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.name}>{wh.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>To Location *</label>
            <select
              value={formData.toLocation}
              onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
              required
            >
              <option value="">Select Destination</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.name}>{wh.name}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Transfers;