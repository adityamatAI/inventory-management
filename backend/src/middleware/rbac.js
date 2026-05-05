const allowRoles = (...roles) => (req, res, next) => {
  // req.user must exist (meaning verifyToken ran before this)
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }
  next();
};

module.exports = { allowRoles };