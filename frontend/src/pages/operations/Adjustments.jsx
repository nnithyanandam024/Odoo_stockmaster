import React, { useState, useEffect } from 'react';
import { Plus, ClipboardEdit } from 'lucide-react';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { operationsAPI, productAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Adjustments = () => {
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    countedQuantity: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adjustmentsRes, productsRes] = await Promise.all([
        operationsAPI.getAll(),
        productAPI.getAll()
      ]);
      setAdjustments(adjustmentsRes.data.filter(op => op.type === 'adjustment'));
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const product = products.find(p => p.id === e.target.value);
    setSelectedProduct(product);
    setFormData({
      ...formData,
      productId: e.target.value,
      productName: product?.name || '',
      countedQuantity: product?.stock || 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const difference = formData.countedQuantity - (selectedProduct?.stock || 0);

    try {
      const response = await operationsAPI.createAdjustment({
        ...formData,
        quantity: difference
      });
      setAdjustments([response.data, ...adjustments]);
      toast.success('Stock adjustment recorded');
      setModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create adjustment');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ productId: '', productName: '', countedQuantity: 0, notes: '' });
    setSelectedProduct(null);
  };

  if (loading) return <Loading />;

  const getDifference = () => {
    if (!selectedProduct) return 0;
    return formData.countedQuantity - selectedProduct.stock;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Stock Adjustments</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={20} />
          New Adjustment
        </button>
      </div>

      <div className="card">
        {adjustments.length === 0 ? (
          <div className="empty-state">
            <ClipboardEdit size={64} />
            <h3>No adjustments yet</h3>
            <p>Create adjustments to fix mismatches between recorded and physical stock</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Adjustment</th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adj) => (
                  <tr key={adj.id}>
                    <td><code>ADJ-{adj.id}</code></td>
                    <td>{adj.productName}</td>
                    <td>
                      <span style={{ 
                        fontWeight: '600', 
                        color: adj.quantity > 0 ? '#10b981' : adj.quantity < 0 ? '#ef4444' : '#6b7280' 
                      }}>
                        {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                      </span>
                    </td>
                    <td>{adj.notes || '-'}</td>
                    <td>{adj.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Adjustment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="Stock Adjustment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : 'Apply Adjustment'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Product *</label>
            <select value={formData.productId} onChange={handleProductChange} required>
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div style={{ 
              background: '#f3f4f6', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '16px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Current System Stock:</span>
                <strong>{selectedProduct.stock} {selectedProduct.unitOfMeasure}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Location:</span>
                <span>{selectedProduct.warehouse}</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Actual Counted Quantity *</label>
            <input
              type="number"
              value={formData.countedQuantity}
              onChange={(e) => setFormData({ ...formData, countedQuantity: parseInt(e.target.value) || 0 })}
              min="0"
              required
            />
          </div>

          {selectedProduct && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '8px',
              background: getDifference() === 0 ? '#f3f4f6' : getDifference() > 0 ? '#d1fae5' : '#fee2e2',
              marginBottom: '16px'
            }}>
              <strong>Difference: </strong>
              <span style={{ 
                fontWeight: '700',
                color: getDifference() === 0 ? '#6b7280' : getDifference() > 0 ? '#10b981' : '#ef4444'
              }}>
                {getDifference() > 0 ? '+' : ''}{getDifference()} {selectedProduct.unitOfMeasure}
              </span>
            </div>
          )}

          <div className="form-group">
            <label>Notes / Reason</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., Damaged items, Theft, Counting error"
              rows={3}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Adjustments;