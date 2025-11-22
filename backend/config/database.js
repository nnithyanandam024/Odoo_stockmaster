const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stockmaster',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Database initialization
const initDatabase = async () => {
  const connection = await pool.getConnection();
  
  try {
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'stockmaster'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'stockmaster'}`);

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);

    // Warehouses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        capacity INT DEFAULT 1000,
        used INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      )
    `);

    // Products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100),
        unit_of_measure VARCHAR(50) DEFAULT 'pcs',
        stock INT DEFAULT 0,
        min_stock INT DEFAULT 10,
        warehouse VARCHAR(255),
        location VARCHAR(255),
        price DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sku (sku),
        INDEX idx_category (category),
        INDEX idx_warehouse (warehouse)
      )
    `);

    // Operations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS operations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        type ENUM('receipt', 'delivery', 'transfer', 'adjustment') NOT NULL,
        status ENUM('draft', 'waiting', 'ready', 'done', 'canceled') DEFAULT 'draft',
        product_id VARCHAR(36),
        product_name VARCHAR(255),
        quantity INT NOT NULL,
        supplier VARCHAR(255),
        customer VARCHAR(255),
        from_location VARCHAR(255),
        to_location VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        INDEX idx_type (type),
        INDEX idx_status (status),
        INDEX idx_product_id (product_id),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    // Stock ledger table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stock_ledger (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        product_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        type ENUM('opening-stock', 'receipt', 'delivery', 'transfer', 'adjustment') NOT NULL,
        reference VARCHAR(100),
        quantity_in INT DEFAULT 0,
        quantity_out INT DEFAULT 0,
        balance INT NOT NULL,
        location VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Picking tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS picking_tasks (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        product_name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        quantity INT NOT NULL,
        unit VARCHAR(50),
        location VARCHAR(255),
        order_id VARCHAR(100),
        customer VARCHAR(255),
        status ENUM('pending', 'picking', 'picked', 'packed') DEFAULT 'pending',
        picked_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_order_id (order_id)
      )
    `);

    // Shelving tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shelving_tasks (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        product_name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        quantity INT NOT NULL,
        unit VARCHAR(50),
        receipt_id VARCHAR(100),
        supplier VARCHAR(255),
        suggested_location VARCHAR(255),
        assigned_location VARCHAR(255),
        status ENUM('pending', 'shelving', 'shelved') DEFAULT 'pending',
        shelved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_status (status)
      )
    `);

    // Packing tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS packing_tasks (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        order_id VARCHAR(100) NOT NULL,
        customer VARCHAR(255),
        shipping_address TEXT,
        box_size VARCHAR(50),
        weight VARCHAR(50),
        status ENUM('pending', 'packing', 'packed', 'shipped') DEFAULT 'pending',
        packed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_order_id (order_id)
      )
    `);

    // Packing task items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS packing_task_items (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        packing_task_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (packing_task_id) REFERENCES packing_tasks(id) ON DELETE CASCADE
      )
    `);

    // Counting sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS counting_sessions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        warehouse VARCHAR(255),
        category VARCHAR(100),
        item_count INT DEFAULT 0,
        status ENUM('draft', 'in-progress', 'completed', 'applied') DEFAULT 'draft',
        discrepancies INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        INDEX idx_status (status)
      )
    `);

    // Counting session items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS counting_session_items (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        session_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        system_quantity INT NOT NULL,
        counted_quantity INT,
        unit VARCHAR(50),
        counted BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (session_id) REFERENCES counting_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Insert default admin user if not exists
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@stockmaster.com', hashedPassword, 'admin']
      );
      
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['John Manager', 'manager@stockmaster.com', hashedPassword, 'manager']
      );
      
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Mike Staff', 'staff@stockmaster.com', hashedPassword, 'staff']
      );
    }

    // Insert default warehouses if not exists
    const [warehouses] = await connection.query('SELECT COUNT(*) as count FROM warehouses');
    if (warehouses[0].count === 0) {
      await connection.query(
        'INSERT INTO warehouses (name, location, capacity, used) VALUES (?, ?, ?, ?)',
        ['Main Warehouse', 'Building A', 10000, 0]
      );
      
      await connection.query(
        'INSERT INTO warehouses (name, location, capacity, used) VALUES (?, ?, ?, ?)',
        ['Warehouse B', 'Building B', 5000, 0]
      );
    }

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { pool, initDatabase };