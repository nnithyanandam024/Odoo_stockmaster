const { pool } = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const getAllProducts = async (req, res, next) => {
  try {
    const { category, warehouse, search } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (warehouse && warehouse !== 'all') {
      query += ' AND warehouse = ?';
      params.push(warehouse);
    }

    if (search) {
      query += ' AND (name LIKE ? OR sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [products] = await pool.query(query, params);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockProducts = async (req, res, next) => {
  try {
    const [products] = await pool.query(
      'SELECT id, name, sku, stock, min_stock FROM products WHERE stock <= min_stock ORDER BY stock ASC'
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);

    if (products.length === 0) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      unitOfMeasure,
      stock,
      minStock,
      warehouse,
      location,
      price
    } = req.body;

    // Check if SKU already exists
    const [existing] = await pool.query('SELECT id FROM products WHERE sku = ?', [sku]);
    if (existing.length > 0) {
      throw new AppError('SKU already exists', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO products 
       (name, sku, category, unit_of_measure, stock, min_stock, warehouse, location, price) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, category, unitOfMeasure || 'pcs', stock || 0, minStock || 10, warehouse, location, price || 0]
    );

    // Add to stock ledger if initial stock > 0
    if (stock > 0) {
      const productId = result.insertId;
      await pool.query(
        `INSERT INTO stock_ledger 
         (product_id, product_name, sku, type, reference, quantity_in, balance, location, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, name, sku, 'opening-stock', 'OPEN-001', stock, stock, warehouse, 'Opening stock']
      );
    }

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      unitOfMeasure,
      stock,
      minStock,
      warehouse,
      location,
      price
    } = req.body;

    // Check if product exists
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      throw new AppError('Product not found', 404);
    }

    // Check if SKU is being changed and if it conflicts
    if (sku !== existing[0].sku) {
      const [skuCheck] = await pool.query('SELECT id FROM products WHERE sku = ? AND id != ?', [sku, req.params.id]);
      if (skuCheck.length > 0) {
        throw new AppError('SKU already exists', 400);
      }
    }

    await pool.query(
      `UPDATE products 
       SET name = ?, sku = ?, category = ?, unit_of_measure = ?, 
           stock = ?, min_stock = ?, warehouse = ?, location = ?, price = ? 
       WHERE id = ?`,
      [name, sku, category, unitOfMeasure, stock, minStock, warehouse, location, price, req.params.id]
    );

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      throw new AppError('Product not found', 404);
    }

    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getLowStockProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};