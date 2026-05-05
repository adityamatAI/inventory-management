const express = require('express');
const { db } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// Apply verifyToken to all routes in this file
router.use(verifyToken);

// GET /api/items (Staff, Manager, Admin)
router.get('/', allowRoles('admin', 'manager', 'staff'), (req, res) => {
  const items = db.prepare(`
    SELECT i.*, s.name as supplier_name 
    FROM items i 
    LEFT JOIN suppliers s ON i.supplier_id = s.id 
    WHERE i.is_active = 1
  `).all();
  res.json(items);
});

// POST /api/items (Admin, Manager)
router.post('/', allowRoles('admin', 'manager'), auditLogger('ITEM_CREATED', 'item'), (req, res) => {
  const { name, sku, current_qty, min_threshold, refill_qty, supplier_id } = req.body;
  const insert = db.prepare(`
    INSERT INTO items (name, sku, current_qty, min_threshold, refill_qty, supplier_id) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(name, sku, current_qty || 0, min_threshold, refill_qty, supplier_id);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Item created' });
});

// PUT /api/items/:id (Admin, Manager)
router.put('/:id', allowRoles('admin', 'manager'), auditLogger('ITEM_UPDATED', 'item'), (req, res) => {
  const { name, sku, current_qty, min_threshold, refill_qty, supplier_id } = req.body;
  const update = db.prepare(`
    UPDATE items 
    SET name = ?, sku = ?, current_qty = ?, min_threshold = ?, refill_qty = ?, supplier_id = ? 
    WHERE id = ?
  `);
  update.run(name, sku, current_qty, min_threshold, refill_qty, supplier_id, req.params.id);
  res.json({ id: req.params.id, message: 'Item updated' });
});

// DELETE /api/items/:id (Admin Only) - Soft Delete
router.delete('/:id', allowRoles('admin'), auditLogger('ITEM_DELETED', 'item'), (req, res) => {
  db.prepare('UPDATE items SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ id: req.params.id, message: 'Item deleted successfully' });
});

module.exports = router;