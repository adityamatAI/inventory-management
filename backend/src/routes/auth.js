const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// POST /api/auth/login
router.post('/login', auditLogger('LOGIN_SUCCESS', 'user'), (req, res) => {
  const { username, password } = req.body;

  // Join with roles table to get the actual role string ('admin', 'staff', etc.)
  const user = db.prepare(`
    SELECT u.*, r.name as role 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.username = ? AND u.is_active = 1
  `).get(username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
  if (!passwordIsValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Issue the JWT token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  // Attach user object so auditLogger can record who logged in
  req.user = { id: user.id }; 

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// POST /api/auth/logout
router.post('/logout', verifyToken, auditLogger('LOGOUT', 'user'), (req, res) => {
  // Since JWT is stateless, actual logout happens by deleting the token on the frontend.
  // This endpoint exists purely to trigger the audit logger for security tracking.
  res.json({ message: 'Logout recorded successfully' });
});

module.exports = router;