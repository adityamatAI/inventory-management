const express = require('express');
const { db } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLogger');
const { checkThreshold } = require('../utils/thresholdChecker');
const { getItemById, deductStock } = require('../models/itemModel');

const router = express.Router();

// POST /api/stock/deduct (Staff only)
router.post('/deduct', verifyToken, allowRoles('staff'), auditLogger('STOCK_DEDUCT', 'item'), (req, res) => {
  const { item_id, deduct_qty, reason } = req.body;

  // 1. Validate item exists and has sufficient stock
  const item = getItemById(item_id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.current_qty < deduct_qty) return res.status(400).json({ error: 'Insufficient stock' });

  // 2. Deduct stock and record the transaction (via model)
  deductStock(item_id, req.user.id, deduct_qty, reason);

  // 3. Trigger the Observer Pattern (Threshold Checker)
  checkThreshold(item_id);

  res.json({ message: 'Stock deducted successfully', item_id });
});

module.exports = router;