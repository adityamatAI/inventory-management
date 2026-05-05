const { db } = require('../config/database');

const checkThreshold = (itemId) => {
  try {
    // 1. Get current item details
    const item = db.prepare('SELECT * FROM items WHERE id = ? AND is_active = 1').get(itemId);
    if (!item) return;

    // 2. Check if stock is at or below the minimum threshold
    if (item.current_qty <= item.min_threshold) {
      
      // 3. Check if an open request already exists (to avoid duplicates)
      const openRequest = db.prepare(`
        SELECT id FROM replenishment_requests 
        WHERE item_id = ? AND status NOT IN ('closed', 'rejected')
      `).get(itemId);

      if (!openRequest) {
        // 4. Create new pending request
        const insertReq = db.prepare(`
          INSERT INTO replenishment_requests (item_id, supplier_id, requested_qty, status, created_by) 
          VALUES (?, ?, ?, 'pending', 0)
        `);
        const result = insertReq.run(item.id, item.supplier_id, item.refill_qty);

        // 5. Log the automatic generation (User 0 = System)
        const insertLog = db.prepare(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details_json, ip_address) 
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const details = JSON.stringify({ reason: 'Auto-generated below threshold', current_qty: item.current_qty });
        insertLog.run(0, 'REQUEST_GENERATED', 'replenishment_request', result.lastInsertRowid, details, '127.0.0.1');
        
        console.log(`[System] Auto-generated replenishment request #${result.lastInsertRowid} for Item #${item.id}`);
      }
    }
  } catch (error) {
    console.error('[System] Error in threshold checker:', error);
  }
};

module.exports = { checkThreshold };