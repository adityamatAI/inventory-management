const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();
router.use(verifyToken, allowRoles('admin'));

// --- User Management ---
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, r.name as role, u.is_active, u.created_at 
    FROM users u JOIN roles r ON u.role_id = r.id
    WHERE u.id != 0
  `).all();
  res.json(users);
});

router.post('/users', auditLogger('USER_CREATED', 'user'), (req, res) => {
  const { username, password, role_id } = req.body;
  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)
  `).run(username, password_hash, role_id);
  res.status(201).json({ id: result.lastInsertRowid, message: 'User created' });
});

router.put('/users/:id', auditLogger('USER_UPDATED', 'user'), (req, res) => {
  const { role_id, is_active } = req.body;
  db.prepare('UPDATE users SET role_id = ?, is_active = ? WHERE id = ?').run(role_id, is_active, req.params.id);
  res.json({ id: req.params.id, message: 'User updated' });
});

// --- Audit Log ---
router.get('/audit-logs', (req, res) => {
  const page = parseInt(req.query.page || 1, 10);
  const limit = parseInt(req.query.limit || 20, 10);
  const offset = (page - 1) * limit;

  const logs = db.prepare(`
    SELECT a.*, u.username 
    FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);

  const { total } = db.prepare('SELECT COUNT(*) as total FROM audit_logs').get();
  
  res.json({
    data: logs,
    pagination: {
      total,
      page,
      limit
    }
  });
});

module.exports = router;