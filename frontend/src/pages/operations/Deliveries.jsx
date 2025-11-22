import React, { useState, useEffect } from 'react';
import { Plus, Check, X, ArrowUpFromLine } from 'lucide-react';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { operationsAPI, productAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Deliveries = () => {
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    customer: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deliveriesRes, productsRes] = await Promise.all([
        operationsAPI.getAll(),
        productAPI.getAll()
      ]);
      setDeliveries(deliveriesRes.data.filter(op => op.type === 'delivery'));
      setProducts(productsRes.data);
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
    setSaving(true);

    try {
      const response = await operationsAPI.createDelivery(formData);
      setDeliveries([response.data, ...deliveries]);
      toast.success('Delivery order created');
      setModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create delivery');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      await operationsAPI.validate(id);
      setDeliveries(deliveries.map(d => d.id === id ? { ...d, status: 'done' } : d));
      toast.success('Delivery completed! Stock updated.');
    } catch (error) {
      toast.error('Failed to validate');
    }
  };

  const handleCancel = async (id) => {
    try {
      await operationsAPI.cancel(id);
      setDeliveries(deliveries.map(d => d.id === id ? { ...d, status: 'canceled' } : d));
      toast.success('Delivery canceled');
    } catch (error) {
      toast.error('Failed to cancel');
    }
  };

  const resetForm = () => {
    setFormData({ productId: '', productName: '', quantity: 1, customer: '' });
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
        <h1 className="page-title">📤 Deliveries (Outgoing Stock)</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={20} />
          New Delivery
        </button>
      </div>

      <div className="card">
        {deliveries.length === 0 ? (
          <div className="empty-state">
            <ArrowUpFromLine size={64} />
            <h3>No deliveries yet</h3>
            <p>Create delivery orders for customer shipments</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td><code>DLV-{delivery.id}</code></td>
                    <td>{delivery.productName}</td>
                    <td style={{ color: '#ef4444', fontWeight: '600' }}>-{delivery.quantity}</td>
                    <td>{delivery.customer || '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td>{delivery.createdAt}</td>
                    <td>
                      {delivery.status !== 'done' && delivery.status !== 'canceled' && (
                        <div className="actions">
                          <button
                            className="action-btn edit"
                            onClick={() => handleValidate(delivery.id)}
                            title="Complete"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleCancel(delivery.id)}
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

      {/* Create Delivery Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="New Delivery Order"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Creating...' : 'Create Delivery'}
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
                  {product.name} ({product.sku}) - Stock: {product.stock}
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
            <label>Customer</label>
            <input
              type="text"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              placeholder="Enter customer name"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Deliveries;