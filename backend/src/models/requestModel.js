/**
 * requestModel.js — Query helpers for the `replenishment_requests` table.
 * Routes import these functions instead of writing inline db.prepare() calls.
 * Maps to the UML Class Diagram (ReplenishmentRequest entity) in the project report.
 */

const { db } = require('../config/database');

/**
 * Returns all replenishment requests with item, supplier, and creator details.
 * @returns {Array}
 */
const getAllRequests = () => {
  return db.prepare(`
    SELECT 
      rr.id, rr.status, rr.requested_qty, rr.manager_notes, rr.created_at, rr.updated_at,
      i.name as item_name, i.sku,
      s.name as supplier_name,
      u.username as created_by_username
    FROM replenishment_requests rr
    JOIN items i ON rr.item_id = i.id
    JOIN suppliers s ON rr.supplier_id = s.id
    LEFT JOIN users u ON rr.created_by = u.id
    ORDER BY rr.created_at DESC
  `).all();
};

/**
 * Returns a single request by ID.
 * @param {number} id
 * @returns {Object|undefined}
 */
const getRequestById = (id) => {
  return db.prepare('SELECT * FROM replenishment_requests WHERE id = ?').get(id);
};

/**
 * Returns all requests assigned to a specific supplier.
 * @param {number} supplierId
 * @returns {Array}
 */
const getRequestsBySupplierId = (supplierId) => {
  return db.prepare(`
    SELECT rr.id, rr.status, rr.requested_qty, rr.created_at, rr.updated_at, i.name as item_name
    FROM replenishment_requests rr
    JOIN items i ON rr.item_id = i.id
    WHERE rr.supplier_id = ?
    ORDER BY rr.updated_at DESC
  `).all(supplierId);
};

/**
 * Updates the status and optional manager notes of a request.
 * @param {number} id
 * @param {string} status
 * @param {string|null} managerNotes
 */
const updateRequestStatus = (id, status, managerNotes = null) => {
  db.prepare(`
    UPDATE replenishment_requests 
    SET status = ?, manager_notes = COALESCE(?, manager_notes), updated_at = datetime('now') 
    WHERE id = ?
  `).run(status, managerNotes, id);
};

/**
 * Confirms receipt of a delivered request in a single DB transaction:
 * 1. Sets request status to 'closed'
 * 2. Updates item stock quantity
 * 3. Inserts a 'restock' stock transaction record
 * @param {number} requestId
 * @param {number} managerId
 * @returns {Object} Result summary
 */
const confirmReceipt = (requestId, managerId) => {
  const confirmTx = db.transaction(() => {
    const request = getRequestById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'delivered') {
      throw new Error('Illegal state transition: Request must be delivered to confirm receipt.');
    }

    db.prepare(`
      UPDATE replenishment_requests 
      SET status = 'closed', updated_at = datetime('now') 
      WHERE id = ?
    `).run(requestId);

    db.prepare('UPDATE items SET current_qty = current_qty + ? WHERE id = ?')
      .run(request.requested_qty, request.item_id);

    db.prepare(`
      INSERT INTO stock_transactions (item_id, user_id, change_qty, reason, transaction_type)
      VALUES (?, ?, ?, ?, 'restock')
    `).run(request.item_id, managerId, request.requested_qty, `Receipt confirmed for request #${requestId}`);

    return { id: requestId, message: 'Receipt confirmed and stock updated' };
  });

  return confirmTx();
};

module.exports = { getAllRequests, getRequestById, getRequestsBySupplierId, updateRequestStatus, confirmReceipt };
