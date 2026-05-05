const express = require('express');
const { db } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();
router.use(verifyToken, allowRoles('supplier'));

// GET /api/supplier/requests (was /requests/mine) - Get requests assigned to this supplier
router.get('/requests', (req, res) => {
  const supplierInfo = db.prepare('SELECT id FROM suppliers WHERE user_id = ?').get(req.user.id);
  if (!supplierInfo) {
    return res.status(404).json({ error: 'Supplier profile not found for this user.' });
  }

  const requests = db.prepare(`
    SELECT rr.id, rr.status, rr.requested_qty, rr.created_at, rr.updated_at, i.name as item_name
    FROM replenishment_requests rr
    JOIN items i ON rr.item_id = i.id
    WHERE rr.supplier_id = ?
    ORDER BY rr.updated_at DESC
  `).all(supplierInfo.id);

  res.json(requests);
});

// PUT /api/supplier/requests/:id/status - Update request status
router.put('/requests/:id/status', auditLogger('REQUEST_STATUS_UPDATE', 'replenishment_request'),(req, res) => {
  const { status: newStatus } = req.body;
  const requestId = req.params.id;

  const request = db.prepare('SELECT status FROM replenishment_requests WHERE id = ?').get(requestId);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  
  const currentStatus = request.status;
  const validTransitions = {
    forwarded: ['accepted'],
    accepted: ['sent'],
    sent: ['delivered'],
  };

  if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
    return res.status(400).json({ error: `Illegal state transition from '${currentStatus}' to '${newStatus}'.` });
  }

  db.prepare(`
    UPDATE replenishment_requests 
    SET status = ?, updated_at = datetime('now') 
    WHERE id = ?
  `).run(newStatus, requestId);

  res.json({ id: requestId, message: `Status updated to ${newStatus}` });
});

module.exports = router;