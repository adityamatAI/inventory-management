/**
 * itemModel.js — Query helpers for the `items` table.
 * Routes import these functions instead of writing inline db.prepare() calls.
 * Maps to the UML Class Diagram (Item entity) in the project report.
 */

const { db } = require('../config/database');

/**
 * Returns all active items joined with their supplier name.
 * @returns {Array} Array of item objects
 */
const getAllItems = () => {
  return db.prepare(`
    SELECT i.*, s.name as supplier_name 
    FROM items i 
    LEFT JOIN suppliers s ON i.supplier_id = s.id 
    WHERE i.is_active = 1
  `).all();
};

/**
 * Returns a single active item by ID.
 * @param {number} id - Item ID
 * @returns {Object|undefined}
 */
const getItemById = (id) => {
  return db.prepare(`
    SELECT i.*, s.name as supplier_name 
    FROM items i 
    LEFT JOIN suppliers s ON i.supplier_id = s.id 
    WHERE i.id = ? AND i.is_active = 1
  `).get(id);
};

/**
 * Creates a new item.
 * @param {Object} data - { name, sku, current_qty, min_threshold, refill_qty, supplier_id }
 * @returns {{ id: number }} The new item's ID
 */
const createItem = ({ name, sku, current_qty = 0, min_threshold, refill_qty, supplier_id }) => {
  const result = db.prepare(`
    INSERT INTO items (name, sku, current_qty, min_threshold, refill_qty, supplier_id) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, sku, current_qty, min_threshold, refill_qty, supplier_id);
  return { id: result.lastInsertRowid };
};

/**
 * Updates an existing item's details.
 * @param {number} id - Item ID
 * @param {Object} data - { name, sku, current_qty, min_threshold, refill_qty, supplier_id }
 */
const updateItem = (id, { name, sku, current_qty, min_threshold, refill_qty, supplier_id }) => {
  db.prepare(`
    UPDATE items 
    SET name = ?, sku = ?, current_qty = ?, min_threshold = ?, refill_qty = ?, supplier_id = ? 
    WHERE id = ?
  `).run(name, sku, current_qty, min_threshold, refill_qty, supplier_id, id);
};

/**
 * Soft-deletes an item by setting is_active = 0.
 * @param {number} id - Item ID
 */
const softDeleteItem = (id) => {
  db.prepare('UPDATE items SET is_active = 0 WHERE id = ?').run(id);
};

/**
 * Deducts stock from an item and records the transaction.
 * @param {number} itemId
 * @param {number} userId
 * @param {number} deductQty
 * @param {string} reason
 */
const deductStock = (itemId, userId, deductQty, reason) => {
  db.prepare('UPDATE items SET current_qty = current_qty - ? WHERE id = ?').run(deductQty, itemId);
  db.prepare(`
    INSERT INTO stock_transactions (item_id, user_id, change_qty, reason, transaction_type) 
    VALUES (?, ?, ?, ?, 'deduction')
  `).run(itemId, userId, deductQty, reason || 'Manual deduction by staff');
};

module.exports = { getAllItems, getItemById, createItem, updateItem, softDeleteItem, deductStock };
