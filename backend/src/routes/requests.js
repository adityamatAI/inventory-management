const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLogger');
const { getAllRequests, getRequestById, updateRequestStatus, confirmReceipt } = require('../models/requestModel');

const router = express.Router();
router.use(verifyToken);

// GET /api/requests (Manager, Admin) - List all requests
router.get('/', allowRoles('admin', 'manager'), (req, res) => {
  const requests = getAllRequests();
  res.json(requests);
});

// POST /api/requests/:id/approve (Manager)
router.post('/:id/approve', allowRoles('manager'), auditLogger('REQUEST_APPROVED', 'replenishment_request'), (req, res) => {
  const request = getRequestById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Illegal state transition: Request must be pending to be approved.' });
  }
  const { manager_notes } = req.body;
  updateRequestStatus(req.params.id, 'forwarded', manager_notes);
  res.json({ id: req.params.id, message: 'Request approved and forwarded to supplier' });
});

// POST /api/requests/:id/reject (Manager)
router.post('/:id/reject', allowRoles('manager'), auditLogger('REQUEST_REJECTED', 'replenishment_request'), (req, res) => {
  const request = getRequestById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Illegal state transition: Request must be pending to be rejected.' });
  }
  const { manager_notes } = req.body;
  updateRequestStatus(req.params.id, 'rejected', manager_notes);
  res.json({ id: req.params.id, message: 'Request rejected' });
});

// POST /api/requests/:id/confirm-receipt (Manager)
router.post('/:id/confirm-receipt', allowRoles('manager'), auditLogger('RECEIPT_CONFIRMED', 'replenishment_request'), (req, res) => {
  try {
    const result = confirmReceipt(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;