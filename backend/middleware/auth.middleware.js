const jwt = require('jsonwebtoken');
const { AppError } = require('./error.middleware');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      const { pool } = require('../config/database');
      
      // Get user role from database
      const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.user.userId]);
      
      if (users.length === 0) {
        throw new AppError('User not found', 404);
      }

      const userRole = users[0].role;

      if (!roles.includes(userRole)) {
        throw new AppError('Not authorized to access this resource', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize
};