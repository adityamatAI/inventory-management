/**
 * userModel.js — Query helpers for the `users` and `roles` tables.
 * Routes import these functions instead of writing inline db.prepare() calls.
 * Maps to the UML Class Diagram (User entity) in the project report.
 */

const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Returns all non-system users joined with their role name.
 * @returns {Array}
 */
const getAllUsers = () => {
  return db.prepare(`
    SELECT u.id, u.username, r.name as role, u.role_id, u.is_active, u.created_at 
    FROM users u JOIN roles r ON u.role_id = r.id
    WHERE u.id != 0
  `).all();
};

/**
 * Returns a single user by username, including their role name.
 * Used during login to authenticate.
 * @param {string} username
 * @returns {Object|undefined}
 */
const getUserByUsername = (username) => {
  return db.prepare(`
    SELECT u.*, r.name as role 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.username = ? AND u.is_active = 1
  `).get(username);
};

/**
 * Creates a new user with a bcrypt-hashed password.
 * @param {string} username
 * @param {string} password - Plain text password (will be hashed)
 * @param {number} role_id
 * @returns {{ id: number }}
 */
const createUser = (username, password, role_id) => {
  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)
  `).run(username, password_hash, role_id);
  return { id: result.lastInsertRowid };
};

/**
 * Updates a user's role and active status.
 * @param {number} id
 * @param {number} role_id
 * @param {number} is_active - 1 for active, 0 for inactive
 */
const updateUser = (id, role_id, is_active) => {
  db.prepare('UPDATE users SET role_id = ?, is_active = ? WHERE id = ?').run(role_id, is_active, id);
};

/**
 * Returns all roles in the system.
 * @returns {Array} [{ id, name }, ...]
 */
const getAllRoles = () => {
  return db.prepare('SELECT * FROM roles').all();
};

module.exports = { getAllUsers, getUserByUsername, createUser, updateUser, getAllRoles };
