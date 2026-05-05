/**
 * seedData.js — Populates the database with demo-ready data.
 * Run with: node src/utils/seedData.js (from the backend/ directory)
 *
 * Creates:
 *  - 4 roles, 4 users + System user
 *  - 2 suppliers
 *  - 8 items (3 below threshold to trigger auto-requests)
 *  - 5 replenishment requests in various statuses for demo purposes
 */

const { db, initializeDB } = require('../config/database');
const bcrypt = require('bcryptjs');

console.log('Initializing DB Schema...');
initializeDB();

console.log('Seeding Data...');

// ── 1. Roles ──────────────────────────────────────────────────────────────────
const roles = ['admin', 'manager', 'staff', 'supplier'];
const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name) VALUES (?, ?)');
roles.forEach((role, index) => insertRole.run(index + 1, role));

// ── 2. Users ──────────────────────────────────────────────────────────────────
// role_id mapping: 1=admin, 2=manager, 3=staff, 4=supplier
const adminPassword   = bcrypt.hashSync('admin123',    10);
const defaultPassword = bcrypt.hashSync('password123', 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, password_hash, role_id) 
  VALUES (?, ?, ?, ?)
`);

insertUser.run(1, 'admin',           adminPassword,   1);
insertUser.run(2, 'manager_alice',   defaultPassword, 2);
insertUser.run(3, 'staff_bob',       defaultPassword, 3);
insertUser.run(4, 'supplier_vendor', defaultPassword, 4);

// System user (id=0) — used for automated audit logs and threshold-triggered requests
db.prepare(`
  INSERT OR IGNORE INTO users (id, username, password_hash, role_id) VALUES (0, 'System', '', 1)
`).run();

// ── 3. Suppliers ──────────────────────────────────────────────────────────────
const insertSupplier = db.prepare(`
  INSERT OR IGNORE INTO suppliers (id, name, contact_email, user_id) 
  VALUES (?, ?, ?, ?)
`);
// supplier_vendor (user id=4) is linked to Fresh Farms Co. for demo login
insertSupplier.run(1, 'Fresh Farms Co.',   'orders@freshfarms.com',        4);
insertSupplier.run(2, 'Global Groceries',  'supply@globalgroceries.com',   null);

// Add coordinates (UAE locations for demo)
db.prepare('UPDATE suppliers SET latitude = ?, longitude = ? WHERE id = ?').run(25.2048, 55.2708, 1); // Dubai
db.prepare('UPDATE suppliers SET latitude = ?, longitude = ? WHERE id = ?').run(24.4539, 54.3773, 2); // Abu Dhabi


// ── 4. Items (8 total, 3 below threshold) ─────────────────────────────────────
const insertItem = db.prepare(`
  INSERT OR IGNORE INTO items (id, name, sku, current_qty, min_threshold, refill_qty, supplier_id) 
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Supplier 1 — Fresh Farms Co.
insertItem.run(1, 'Organic Apples',      'APP-001',  50,  20, 100, 1);  // ✅ above threshold
insertItem.run(2, 'Whole Milk 1L',       'MILK-001', 10,  15,  50, 1);  // ⚠️ below threshold
insertItem.run(3, 'Free-Range Eggs 12pk','EGGS-012', 30,  25,  60, 1);  // ✅ above threshold
insertItem.run(4, 'Greek Yoghurt 500g',  'YOGH-500',  8,  10,  40, 1);  // ⚠️ below threshold

// Supplier 2 — Global Groceries
insertItem.run(5, 'Basmati Rice 5kg',    'RICE-005',  5,  10,  20, 2);  // ⚠️ below threshold
insertItem.run(6, 'Canned Beans 400g',   'BEAN-001', 100, 30, 200, 2);  // ✅ above threshold
insertItem.run(7, 'Olive Oil 1L',        'OLVOL-01',  45, 15,  30, 2);  // ✅ above threshold
insertItem.run(8, 'Pasta 500g',          'PAST-500',  80, 25,  50, 2);  // ✅ above threshold

// ── 5. Replenishment Requests (various statuses for demo readiness) ────────────
// Inserting requests directly to show the full workflow on first login.
// Statuses covered: pending, forwarded, accepted, closed — every dashboard has content.
const insertRequest = db.prepare(`
  INSERT OR IGNORE INTO replenishment_requests 
    (id, item_id, supplier_id, requested_qty, status, manager_notes, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
`);

// Request #1 — PENDING: auto-generated for Whole Milk (below threshold), awaiting manager review
insertRequest.run(1, 2, 1, 50, 'pending', null, 0, '-2 days', '-2 days');

// Request #2 — FORWARDED: manager approved Basmati Rice request, now with supplier
insertRequest.run(2, 5, 2, 20, 'forwarded', 'Urgent — stock critically low.', 2, '-3 days', '-1 day');

// Request #3 — ACCEPTED: supplier accepted the Greek Yoghurt order, preparing to ship
insertRequest.run(3, 4, 1, 40, 'accepted', 'Approved and forwarded.', 2, '-5 days', '-2 days');

// Request #4 — CLOSED: complete lifecycle demo — Organic Apples restocked last week
insertRequest.run(4, 1, 1, 100, 'closed', 'Restocked. Receipt confirmed.', 2, '-10 days', '-7 days');

// Request #5 — DELIVERED: Fresh Farms delivered Greek Yoghurt, manager needs to confirm receipt
insertRequest.run(5, 4, 1, 40, 'delivered', 'Approved and forwarded.', 2, '-6 days', '-1 day');

// ── 6. Audit Log entries for the pre-seeded requests ─────────────────────────
const insertLog = db.prepare(`
  INSERT OR IGNORE INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, ip_address, created_at)
  VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1', datetime('now', ?))
`);

insertLog.run(1, 0, 'REQUEST_GENERATED',  'replenishment_request', 1, JSON.stringify({ reason: 'Auto-generated: stock below threshold', item: 'Whole Milk 1L' }),      '-2 days');
insertLog.run(2, 2, 'REQUEST_APPROVED',   'replenishment_request', 2, JSON.stringify({ notes: 'Urgent — stock critically low.', item: 'Basmati Rice 5kg' }),           '-1 day');
insertLog.run(3, 2, 'REQUEST_APPROVED',   'replenishment_request', 3, JSON.stringify({ notes: 'Approved and forwarded.', item: 'Greek Yoghurt 500g' }),                  '-2 days');
insertLog.run(4, 2, 'RECEIPT_CONFIRMED',  'replenishment_request', 4, JSON.stringify({ note: 'Restocked. Receipt confirmed.', item: 'Organic Apples', qty_added: 100 }), '-7 days');

// ── Done ─────────────────────────────────────────────────────────────────────
console.log('--------------------------------------------------');
console.log('✅ Seeding completed successfully!');
console.log('');
console.log('Test Accounts:');
console.log('  Admin:    admin           / admin123');
console.log('  Manager:  manager_alice   / password123');
console.log('  Staff:    staff_bob       / password123');
console.log('  Supplier: supplier_vendor / password123');
console.log('');
console.log('Items seeded: 8 (3 below threshold)');
console.log('Requests seeded: 5 (pending, forwarded, accepted, delivered, closed)');
console.log('--------------------------------------------------');