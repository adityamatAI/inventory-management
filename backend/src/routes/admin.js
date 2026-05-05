const express = require('express');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLogger');
const { getAllUsers, createUser, updateUser, getAllRoles } = require('../models/userModel');

const router = express.Router();
router.use(verifyToken, allowRoles('admin'));

// --- User Management ---
router.get('/users', (req, res) => {
  res.json(getAllUsers());
});

router.post('/users', auditLogger('USER_CREATED', 'user'), (req, res) => {
  const { username, password, role_id } = req.body;
  const { id } = createUser(username, password, role_id);
  res.status(201).json({ id, message: 'User created' });
});

router.put('/users/:id', auditLogger('USER_UPDATED', 'user'), (req, res) => {
  const { role_id, is_active } = req.body;
  updateUser(req.params.id, role_id, is_active);
  res.json({ id: req.params.id, message: 'User updated' });
});

// --- Roles ---
router.get('/roles', (req, res) => {
  res.json(getAllRoles());
});

// --- Suppliers (for map view) ---
router.get('/suppliers', (req, res) => {
  const suppliers = db.prepare(`
    SELECT 
      s.id, s.name, s.contact_email, s.latitude, s.longitude,
      COUNT(CASE WHEN rr.status NOT IN ('closed', 'rejected') THEN 1 END) as active_requests
    FROM suppliers s
    LEFT JOIN replenishment_requests rr ON rr.supplier_id = s.id
    GROUP BY s.id
    ORDER BY s.name
  `).all();
  res.json(suppliers);
});


// --- Audit Log ---
const { db } = require('../config/database');

router.get('/audit-logs', (req, res) => {
  const page  = parseInt(req.query.page  || 1,  10);
  const limit = parseInt(req.query.limit || 15, 10);
  const offset = (page - 1) * limit;

  const { action, username, from, to } = req.query;

  const conditions = [];
  const params = [];

  if (action) {
    conditions.push('a.action = ?');
    params.push(action);
  }
  if (username) {
    conditions.push('u.username LIKE ?');
    params.push(`%${username}%`);
  }
  if (from) {
    conditions.push('a.created_at >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('a.created_at <= ?');
    params.push(to + ' 23:59:59');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const logs = db.prepare(`
    SELECT a.*, u.username 
    FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
    ${where}
    ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const { total } = db.prepare(`
    SELECT COUNT(*) as total 
    FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
    ${where}
  `).get(...params);

  const actionTypes = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all().map(r => r.action);

  res.json({
    data: logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    actionTypes,
  });
});

module.exports = router;