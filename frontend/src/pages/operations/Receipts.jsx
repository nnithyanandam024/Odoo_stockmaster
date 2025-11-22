import React, { useState, useEffect } from 'react';
import { Plus, Check, X, ArrowDownToLine } from 'lucide-react';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { operationsAPI, productAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Receipts = () => {
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    supplier: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [receiptsRes, productsRes] = await Promise.all([
        operationsAPI.getAll(),
        productAPI.getAll()
      ]);
      setReceipts(receiptsRes.data.filter(op => op.type === 'receipt'));
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
      const response = await operationsAPI.createReceipt(formData);
      setReceipts([response.data, ...receipts]);
      toast.success('Receipt created successfully');
      setModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create receipt');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      await operationsAPI.validate(id);
      setReceipts(receipts.map(r => r.id === id ? { ...r, status: 'done' } : r));
      toast.success('Receipt validated! Stock updated.');
    } catch (error) {
      toast.error('Failed to validate');
    }
  };

  const handleCancel = async (id) => {
    try {
      await operationsAPI.cancel(id);
      setReceipts(receipts.map(r => r.id === id ? { ...r, status: 'canceled' } : r));
      toast.success('Receipt canceled');
    } catch (error) {
      toast.error('Failed to cancel');
    }
  };

  const resetForm = () => {
    setFormData({ productId: '', productName: '', quantity: 1, supplier: '' });
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
        <h1 className="page-title">📥 Receipts (Incoming Stock)</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={20} />
          New Receipt
        </button>
      </div>

      <div className="card">
        {receipts.length === 0 ? (
          <div className="empty-state">
            <ArrowDownToLine size={64} />
            <h3>No receipts yet</h3>
            <p>Create a new receipt when goods arrive from vendors</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td><code>RCP-{receipt.id}</code></td>
                    <td>{receipt.productName}</td>
                    <td style={{ color: '#10b981', fontWeight: '600' }}>+{receipt.quantity}</td>
                    <td>{receipt.supplier || '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(receipt.status)}`}>
                        {receipt.status}
                      </span>
                    </td>
                    <td>{receipt.createdAt}</td>
                    <td>
                      {receipt.status !== 'done' && receipt.status !== 'canceled' && (
                        <div className="actions">
                          <button
                            className="action-btn edit"
                            onClick={() => handleValidate(receipt.id)}
                            title="Validate"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleCancel(receipt.id)}
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

      {/* Create Receipt Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="New Receipt"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Creating...' : 'Create Receipt'}
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
                <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>
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
            <label>Supplier</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="Enter supplier name"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Receipts;