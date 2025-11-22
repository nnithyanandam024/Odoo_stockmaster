const { pool } = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

// Dashboard Stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [products] = await pool.query('SELECT COUNT(*) as total FROM products');
    const [lowStock] = await pool.query('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock');
    const [outOfStock] = await pool.query('SELECT COUNT(*) as count FROM products WHERE stock = 0');
    const [receipts] = await pool.query("SELECT COUNT(*) as count FROM operations WHERE type = 'receipt' AND status != 'done' AND status != 'canceled'");
    const [deliveries] = await pool.query("SELECT COUNT(*) as count FROM operations WHERE type = 'delivery' AND status != 'done' AND status != 'canceled'");
    const [transfers] = await pool.query("SELECT COUNT(*) as count FROM operations WHERE type = 'transfer' AND status != 'done' AND status != 'canceled'");

    res.json({
      success: true,
      data: {
        totalProducts: products[0].total,
        lowStockItems: lowStock[0].count,
        outOfStockItems: outOfStock[0].count,
        pendingReceipts: receipts[0].count,
        pendingDeliveries: deliveries[0].count,
        scheduledTransfers: transfers[0].count
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get All Operations
exports.getAllOperations = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    
    let query = 'SELECT * FROM operations WHERE 1=1';
    const params = [];

    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [operations] = await pool.query(query, params);

    // Format dates
    const formatted = operations.map(op => ({
      ...op,
      createdAt: new Date(op.created_at).toISOString().split('T')[0],
      completedAt: op.completed_at ? new Date(op.completed_at).toISOString().split('T')[0] : null
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// Create Receipt
exports.createReceipt = async (req, res, next) => {
  try {
    const { productId, productName, quantity, supplier } = req.body;

    const [result] = await pool.query(
      `INSERT INTO operations (type, status, product_id, product_name, quantity, supplier) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['receipt', 'draft', productId, productName, quantity, supplier]
    );

    const [operations] = await pool.query('SELECT * FROM operations WHERE id = ?', [result.insertId]);
    const operation = operations[0];

    res.status(201).json({
      success: true,
      data: {
        ...operation,
        createdAt: new Date(operation.created_at).toISOString().split('T')[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create Delivery
exports.createDelivery = async (req, res, next) => {
  try {
    const { productId, productName, quantity, customer } = req.body;

    // Check stock availability
    const [products] = await pool.query('SELECT stock FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      throw new AppError('Product not found', 404);
    }

    if (products[0].stock < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO operations (type, status, product_id, product_name, quantity, customer) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['delivery', 'draft', productId, productName, quantity, customer]
    );

    const [operations] = await pool.query('SELECT * FROM operations WHERE id = ?', [result.insertId]);
    const operation = operations[0];

    res.status(201).json({
      success: true,
      data: {
        ...operation,
        createdAt: new Date(operation.created_at).toISOString().split('T')[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create Transfer
exports.createTransfer = async (req, res, next) => {
  try {
    const { productId, productName, quantity, fromLocation, toLocation } = req.body;

    const [result] = await pool.query(
      `INSERT INTO operations (type, status, product_id, product_name, quantity, from_location, to_location) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['transfer', 'draft', productId, productName, quantity, fromLocation, toLocation]
    );

    const [operations] = await pool.query('SELECT * FROM operations WHERE id = ?', [result.insertId]);
    const operation = operations[0];

    res.status(201).json({
      success: true,
      data: {
        ...operation,
        createdAt: new Date(operation.created_at).toISOString().split('T')[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create Adjustment
exports.createAdjustment = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { productId, productName, quantity, notes } = req.body;

    // Get current stock
    const [products] = await connection.query('SELECT stock, sku, warehouse FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      throw new AppError('Product not found', 404);
    }

    const product = products[0];
    const newStock = Math.max(0, product.stock + quantity);

    // Update product stock
    await connection.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId]);

    // Create adjustment operation
    const [result] = await connection.query(
      `INSERT INTO operations (type, status, product_id, product_name, quantity, notes, completed_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      ['adjustment', 'done', productId, productName, quantity, notes]
    );

    // Add to stock ledger
    await connection.query(
      `INSERT INTO stock_ledger 
       (product_id, product_name, sku, type, reference, quantity_in, quantity_out, balance, location, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        productName,
        product.sku,
        'adjustment',
        `ADJ-${result.insertId}`,
        quantity > 0 ? quantity : 0,
        quantity < 0 ? Math.abs(quantity) : 0,
        newStock,
        product.warehouse,
        notes
      ]
    );

    await connection.commit();

    const [operations] = await connection.query('SELECT * FROM operations WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      data: {
        ...operations[0],
        createdAt: new Date(operations[0].created_at).toISOString().split('T')[0]
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Validate Operation (Complete Receipt/Delivery/Transfer)
exports.validateOperation = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const [operations] = await connection.query('SELECT * FROM operations WHERE id = ?', [req.params.id]);
    if (operations.length === 0) {
      throw new AppError('Operation not found', 404);
    }

    const operation = operations[0];

    // Get product details
    const [products] = await connection.query('SELECT * FROM products WHERE id = ?', [operation.product_id]);
    if (products.length === 0) {
      throw new AppError('Product not found', 404);
    }

    const product = products[0];
    let newStock = product.stock;

    // Update stock based on operation type
    if (operation.type === 'receipt') {
      newStock += operation.quantity;
    } else if (operation.type === 'delivery') {
      if (product.stock < operation.quantity) {
        throw new AppError('Insufficient stock', 400);
      }
      newStock -= operation.quantity;
    }

    // Update product stock
    await connection.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, operation.product_id]);

    // Update operation status
    await connection.query(
      'UPDATE operations SET status = ?, completed_at = NOW() WHERE id = ?',
      ['done', req.params.id]
    );

    // Add to stock ledger
    await connection.query(
      `INSERT INTO stock_ledger 
       (product_id, product_name, sku, type, reference, quantity_in, quantity_out, balance, location, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        operation.product_id,
        operation.product_name,
        product.sku,
        operation.type,
        `${operation.type.toUpperCase().substring(0, 3)}-${operation.id}`,
        operation.type === 'receipt' ? operation.quantity : 0,
        operation.type === 'delivery' ? operation.quantity : 0,
        newStock,
        product.warehouse,
        operation.type === 'receipt' ? `Supplier: ${operation.supplier || 'N/A'}` : `Customer: ${operation.customer || 'N/A'}`
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Operation validated successfully'
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Cancel Operation
exports.cancelOperation = async (req, res, next) => {
  try {
    await pool.query('UPDATE operations SET status = ? WHERE id = ?', ['canceled', req.params.id]);

    res.json({
      success: true,
      message: 'Operation canceled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// CONTINUATION OF operation.controller.js
// Add these exports to the previous file

// Picking Tasks
exports.getPickingTasks = async (req, res, next) => {
  try {
    const [tasks] = await pool.query('SELECT * FROM picking_tasks ORDER BY created_at DESC');

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

exports.completePicking = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE picking_tasks SET status = ?, picked_at = NOW() WHERE id = ?',
      ['picked', req.params.id]
    );

    res.json({
      success: true,
      message: 'Picking completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Shelving Tasks
exports.getShelvingTasks = async (req, res, next) => {
  try {
    const [tasks] = await pool.query('SELECT * FROM shelving_tasks ORDER BY created_at DESC');

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

exports.completeShelving = async (req, res, next) => {
  try {
    const { location } = req.body;

    await pool.query(
      'UPDATE shelving_tasks SET status = ?, assigned_location = ?, shelved_at = NOW() WHERE id = ?',
      ['shelved', location, req.params.id]
    );

    res.json({
      success: true,
      message: 'Shelving completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Packing Tasks
exports.getPackingTasks = async (req, res, next) => {
  try {
    const [tasks] = await pool.query('SELECT * FROM packing_tasks ORDER BY created_at DESC');

    // Get items for each task
    for (let task of tasks) {
      const [items] = await pool.query(
        'SELECT product_name as name, quantity FROM packing_task_items WHERE packing_task_id = ?',
        [task.id]
      );
      task.items = items;
    }

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

exports.completePacking = async (req, res, next) => {
  try {
    const { boxSize, weight, notes } = req.body;

    await pool.query(
      'UPDATE packing_tasks SET status = ?, box_size = ?, weight = ?, packed_at = NOW() WHERE id = ?',
      ['packed', boxSize, weight, req.params.id]
    );

    res.json({
      success: true,
      message: 'Packing completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Stock Ledger
exports.getStockLedger = async (req, res, next) => {
  try {
    const { productId, type, dateFrom, dateTo } = req.query;
    
    let query = 'SELECT * FROM stock_ledger WHERE 1=1';
    const params = [];

    if (productId && productId !== 'all') {
      query += ' AND product_id = ?';
      params.push(productId);
    }

    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (dateFrom) {
      query += ' AND DATE(created_at) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND DATE(created_at) <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY created_at DESC';

    const [entries] = await pool.query(query, params);

    // Format dates
    const formatted = entries.map(entry => ({
      ...entry,
      date: new Date(entry.created_at).toISOString().split('T')[0],
      time: new Date(entry.created_at).toTimeString().split(' ')[0].substring(0, 5)
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// Stock Counting Sessions
exports.getCountingSessions = async (req, res, next) => {
  try {
    const [sessions] = await pool.query('SELECT * FROM counting_sessions ORDER BY created_at DESC');

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

exports.createCountingSession = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { name, warehouse, category } = req.body;

    // Get products to count
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (warehouse) {
      query += ' AND warehouse = ?';
      params.push(warehouse);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    const [products] = await connection.query(query, params);

    // Create session
    const [result] = await connection.query(
      'INSERT INTO counting_sessions (name, warehouse, category, item_count, status) VALUES (?, ?, ?, ?, ?)',
      [name, warehouse, category, products.length, 'draft']
    );

    const sessionId = result.insertId;

    // Add items to session
    for (const product of products) {
      await connection.query(
        `INSERT INTO counting_session_items 
         (session_id, product_id, product_name, sku, location, system_quantity, unit) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sessionId, product.id, product.name, product.sku, product.location, product.stock, product.unit_of_measure]
      );
    }

    await connection.commit();

    // Get the created session with items
    const [sessions] = await connection.query('SELECT * FROM counting_sessions WHERE id = ?', [sessionId]);
    const [items] = await connection.query(
      'SELECT * FROM counting_session_items WHERE session_id = ?',
      [sessionId]
    );

    const session = sessions[0];
    session.items = items;

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

exports.saveCountingSession = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { items } = req.body;
    let discrepancies = 0;

    // Update counted items
    for (const item of items) {
      await connection.query(
        `UPDATE counting_session_items 
         SET counted_quantity = ?, counted = ? 
         WHERE session_id = ? AND product_id = ?`,
        [item.countedQuantity, item.counted, req.params.id, item.productId]
      );

      if (item.counted && item.countedQuantity !== item.systemQuantity) {
        discrepancies++;
      }
    }

    // Update session status
    await connection.query(
      'UPDATE counting_sessions SET status = ?, discrepancies = ?, completed_at = NOW() WHERE id = ?',
      ['completed', discrepancies, req.params.id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Counting session saved successfully'
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};