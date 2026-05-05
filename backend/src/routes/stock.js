const express = require('express');
const { db } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLogger');
const { checkThreshold } = require('../utils/thresholdChecker');

const router = express.Router();

// POST /api/stock/deduct (Staff only)
router.post('/deduct', verifyToken, allowRoles('staff'), auditLogger('STOCK_DEDUCT', 'item'), (req, res) => {
  const { item_id, deduct_qty, reason } = req.body;

  // 1. Get current stock
  const item = db.prepare('SELECT current_qty FROM items WHERE id = ? AND is_active = 1').get(item_id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.current_qty < deduct_qty) return res.status(400).json({ error: 'Insufficient stock' });

  // 2. Deduct stock
  db.prepare('UPDATE items SET current_qty = current_qty - ? WHERE id = ?').run(deduct_qty, item_id);

  // 3. Record transaction
  db.prepare(`
    INSERT INTO stock_transactions (item_id, user_id, change_qty, reason, transaction_type) 
    VALUES (?, ?, ?, ?, 'deduction')
  `).run(item_id, req.user.id, deduct_qty, reason || 'Manual deduction by staff');

  // 4. Trigger the Observer Pattern (Threshold Checker)
  checkThreshold(item_id);

  res.json({ message: 'Stock deducted successfully', item_id });
});

module.exports = router;