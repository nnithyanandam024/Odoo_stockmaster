const { pool } = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const getAllWarehouses = async (req, res, next) => {
  try {
    const [warehouses] = await pool.query('SELECT * FROM warehouses ORDER BY created_at DESC');
    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    next(error);
  }
};

const getWarehouseById = async (req, res, next) => {
  try {
    const [warehouses] = await pool.query('SELECT * FROM warehouses WHERE id = ?', [req.params.id]);
    if (warehouses.length === 0) {
      throw new AppError('Warehouse not found', 404);
    }
    res.json({
      success: true,
      data: warehouses[0]
    });
  } catch (error) {
    next(error);
  }
};

const createWarehouse = async (req, res, next) => {
  try {
    const { name, location, capacity } = req.body;
    const [existing] = await pool.query('SELECT id FROM warehouses WHERE name = ?', [name]);
    if (existing.length > 0) {
      throw new AppError('Warehouse name already exists', 400);
    }
    const [result] = await pool.query(
      'INSERT INTO warehouses (name, location, capacity, used) VALUES (?, ?, ?, ?)',
      [name, location, capacity || 1000, 0]
    );
    const [warehouses] = await pool.query('SELECT * FROM warehouses WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      data: warehouses[0]
    });
  } catch (error) {
    next(error);
  }
};

const updateWarehouse = async (req, res, next) => {
  try {
    const { name, location, capacity } = req.body;
    const [existing] = await pool.query('SELECT * FROM warehouses WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      throw new AppError('Warehouse not found', 404);
    }
    if (name !== existing[0].name) {
      const [nameCheck] = await pool.query(
        'SELECT id FROM warehouses WHERE name = ? AND id != ?',
        [name, req.params.id]
      );
      if (nameCheck.length > 0) {
        throw new AppError('Warehouse name already exists', 400);
      }
    }
    await pool.query(
      'UPDATE warehouses SET name = ?, location = ?, capacity = ? WHERE id = ?',
      [name, location, capacity, req.params.id]
    );
    const [warehouses] = await pool.query('SELECT * FROM warehouses WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      data: warehouses[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteWarehouse = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id, name FROM warehouses WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      throw new AppError('Warehouse not found', 404);
    }
    const [products] = await pool.query('SELECT COUNT(*) as count FROM products WHERE warehouse = ?', [existing[0].name]);
    if (products[0].count > 0) {
      throw new AppError('Cannot delete warehouse that has products', 400);
    }
    await pool.query('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ✅ IMPORTANT: Export all functions
module.exports = {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
};