const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLogger');
const { getAllItems, getItemById, createItem, updateItem, softDeleteItem } = require('../models/itemModel');

const router = express.Router();
router.use(verifyToken);

// GET /api/items (Staff, Manager, Admin)
router.get('/', allowRoles('admin', 'manager', 'staff'), (req, res) => {
  const items = getAllItems();
  res.json(items);
});

// POST /api/items (Admin, Manager)
router.post('/', allowRoles('admin', 'manager'), auditLogger('ITEM_CREATED', 'item'), (req, res) => {
  const { name, sku, current_qty, min_threshold, refill_qty, supplier_id } = req.body;
  const { id } = createItem({ name, sku, current_qty, min_threshold, refill_qty, supplier_id });
  res.status(201).json({ id, message: 'Item created' });
});

// PUT /api/items/:id (Admin, Manager)
router.put('/:id', allowRoles('admin', 'manager'), auditLogger('ITEM_UPDATED', 'item'), (req, res) => {
  const { name, sku, current_qty, min_threshold, refill_qty, supplier_id } = req.body;
  updateItem(req.params.id, { name, sku, current_qty, min_threshold, refill_qty, supplier_id });
  res.json({ id: req.params.id, message: 'Item updated' });
});

// DELETE /api/items/:id (Admin Only) - Soft Delete
router.delete('/:id', allowRoles('admin'), auditLogger('ITEM_DELETED', 'item'), (req, res) => {
  softDeleteItem(req.params.id);
  res.json({ id: req.params.id, message: 'Item deleted successfully' });
});

module.exports = router;