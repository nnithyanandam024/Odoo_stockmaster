const express = require('express');
const router = express.Router();
const operationController = require('../controllers/operation.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Dashboard
router.get('/dashboard-stats', operationController.getDashboardStats);

// Operations
router.get('/', operationController.getAllOperations);
router.post('/receipt', operationController.createReceipt);
router.post('/delivery', operationController.createDelivery);
router.post('/transfer', operationController.createTransfer);
router.post('/adjustment', operationController.createAdjustment);
router.put('/:id/validate', operationController.validateOperation);
router.put('/:id/cancel', operationController.cancelOperation);

// Picking
router.get('/picking-tasks', operationController.getPickingTasks);
router.put('/picking-tasks/:id/complete', operationController.completePicking);

// Shelving
router.get('/shelving-tasks', operationController.getShelvingTasks);
router.put('/shelving-tasks/:id/complete', operationController.completeShelving);

// Packing
router.get('/packing-tasks', operationController.getPackingTasks);
router.put('/packing-tasks/:id/complete', operationController.completePacking);

// Stock Ledger
router.get('/stock-ledger', operationController.getStockLedger);

// Stock Counting
router.get('/counting-sessions', operationController.getCountingSessions);
router.post('/counting-sessions', operationController.createCountingSession);
router.put('/counting-sessions/:id/save', operationController.saveCountingSession);

module.exports = router;