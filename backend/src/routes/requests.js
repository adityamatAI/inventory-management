const express = require('express');
const { db } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();
router.use(verifyToken);

// GET /api/requests (Manager, Admin) - List all requests
router.get('/', allowRoles('admin', 'manager'), (req, res) => {
  const requests = db.prepare(`
    SELECT 
      rr.id, rr.status, rr.requested_qty, rr.created_at, rr.updated_at,
      i.name as item_name, i.sku,
      s.name as supplier_name,
      u.username as created_by_username
    FROM replenishment_requests rr
    JOIN items i ON rr.item_id = i.id
    JOIN suppliers s ON rr.supplier_id = s.id
    LEFT JOIN users u ON rr.created_by = u.id
    ORDER BY rr.created_at DESC
  `).all();
  res.json(requests);
});

// POST /api/requests/:id/approve (Manager)
router.post('/:id/approve', allowRoles('manager'), auditLogger('REQUEST_APPROVED', 'replenishment_request'), (req, res) => {
  const request = db.prepare('SELECT status FROM replenishment_requests WHERE id = ?').get(req.params.id);
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Illegal state transition: Request must be pending to be approved.' });
  }

  const { manager_notes } = req.body;
  db.prepare(`
    UPDATE replenishment_requests 
    SET status = 'forwarded', manager_notes = ?, updated_at = datetime('now') 
    WHERE id = ?
  `).run(manager_notes, req.params.id);

  res.json({ id: req.params.id, message: 'Request approved and forwarded to supplier' });
});

// POST /api/requests/:id/reject (Manager)
router.post('/:id/reject', allowRoles('manager'), auditLogger('REQUEST_REJECTED', 'replenishment_request'), (req, res) => {
  const request = db.prepare('SELECT status FROM replenishment_requests WHERE id = ?').get(req.params.id);
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Illegal state transition: Request must be pending to be rejected.' });
  }
  
  const { manager_notes } = req.body;
  db.prepare(`
    UPDATE replenishment_requests 
    SET status = 'rejected', manager_notes = ?, updated_at = datetime('now') 
    WHERE id = ?
  `).run(manager_notes, req.params.id);

  res.json({ id: req.params.id, message: 'Request rejected' });
});

// POST /api/requests/:id/confirm-receipt (Manager)
router.post('/:id/confirm-receipt', allowRoles('manager'), auditLogger('RECEIPT_CONFIRMED', 'replenishment_request'), (req, res) => {
  const confirmReceiptTx = db.transaction((requestId, managerId) => {
    const request = db.prepare('SELECT * FROM replenishment_requests WHERE id = ?').get(requestId);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'delivered') throw new Error('Illegal state transition: Request must be delivered to confirm receipt.');
    
    // 1. Update request status to 'closed'
    db.prepare(`
      UPDATE replenishment_requests 
      SET status = 'closed', updated_at = datetime('now') 
      WHERE id = ?
    `).run(requestId);

    // 2. Update item's stock quantity
    db.prepare('UPDATE items SET current_qty = current_qty + ? WHERE id = ?').run(request.requested_qty, request.item_id);

    // 3. Insert a 'restock' transaction
    db.prepare(`
      INSERT INTO stock_transactions (item_id, user_id, change_qty, reason, transaction_type)
      VALUES (?, ?, ?, ?, 'restock')
    `).run(request.item_id, managerId, request.requested_qty, `Receipt confirmed for request #${requestId}`);
    
    return { id: requestId, message: 'Receipt confirmed and stock updated' };
  });

  try {
    const result = confirmReceiptTx(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;