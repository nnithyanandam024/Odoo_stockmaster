import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Loading from '../../components/Loading';
import { productAPI, warehouseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitOfMeasure: 'pcs',
    stock: 0,
    minStock: 10,
    warehouse: '',
    location: '',
    price: 0
  });

  useEffect(() => {
    fetchWarehouses();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(response.data);
      if (!isEdit && response.data.length > 0) {
        setFormData(prev => ({ ...prev, warehouse: response.data[0].name }));
      }
    } catch (error) {
      console.error('Failed to fetch warehouses');
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await productAPI.getById(id);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to fetch product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEdit) {
        await productAPI.update(id, formData);
        toast.success('Product updated successfully');
      } else {
        await productAPI.create(formData);
        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/products')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-group">
              <label>SKU / Code *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g., PRD-001"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Raw Materials, Furniture"
                required
              />
            </div>

            <div className="form-group">
              <label>Unit of Measure</label>
              <select name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange}>
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="m">Meters (m)</option>
                <option value="l">Liters (l)</option>
                <option value="box">Box</option>
                <option value="set">Set</option>
              </select>
            </div>

            <div className="form-group">
              <label>Warehouse *</label>
              <select name="warehouse" value={formData.warehouse} onChange={handleChange} required>
                <option value="">Select Warehouse</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.name}>{wh.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Location / Rack</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Rack A, Shelf 3"
              />
            </div>

            <div className="form-group">
              <label>Initial Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Minimum Stock (Reorder Level)</label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={20} />
              {saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;