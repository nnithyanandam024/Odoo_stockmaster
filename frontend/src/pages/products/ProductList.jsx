import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ProductList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productAPI.delete(deleteModal.product.id);
      toast.success('Product deleted successfully');
      setProducts(products.filter(p => p.id !== deleteModal.product.id));
      setDeleteModal({ open: false, product: null });
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return { label: 'Out of Stock', class: 'badge-danger' };
    if (product.stock < product.minStock) return { label: 'Low Stock', class: 'badge-warning' };
    return { label: 'In Stock', class: 'badge-success' };
  };

  // Get unique categories and warehouses for filters
  const categories = [...new Set(products.map(p => p.category))];
  const warehouses = [...new Set(products.map(p => p.warehouse))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesWarehouse = warehouseFilter === 'all' || product.warehouse === warehouseFilter;
    return matchesSearch && matchesCategory && matchesWarehouse;
  });

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <Link to="/products/new" className="btn btn-primary">
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="filters-bar">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%' }}
            />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
            <option value="all">All Warehouses</option>
            {warehouses.map(wh => (
              <option key={wh} value={wh}>{wh}</option>
            ))}
          </select>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={64} />
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Warehouse</th>
                  <th>Stock</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product.id}>
                      <td style={{ fontWeight: '500' }}>{product.name}</td>
                      <td><code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{product.sku}</code></td>
                      <td>{product.category}</td>
                      <td>{product.warehouse}</td>
                      <td>
                        <span style={{ fontWeight: '600', color: product.stock < product.minStock ? '#ef4444' : '#374151' }}>
                          {product.stock}
                        </span>
                        <span style={{ color: '#9ca3af' }}> / {product.minStock}</span>
                      </td>
                      <td>{product.unitOfMeasure}</td>
                      <td>${product.price}</td>
                      <td>
                        <span className={`badge ${status.class}`}>{status.label}</span>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="action-btn edit"
                            onClick={() => navigate(`/products/edit/${product.id}`)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => setDeleteModal({ open: true, product })}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        title="Delete Product"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, product: null })}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{deleteModal.product?.name}</strong>?</p>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default ProductList;