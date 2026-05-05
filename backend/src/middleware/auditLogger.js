const { db } = require('../config/database');

const auditLogger = (action, entityType) => {
  return (req, res, next) => {
    
    // Intercept JSON responses so we can extract new IDs (e.g., when an item is created)
    const originalJson = res.json;
    res.json = function (data) {
      res.locals.responseData = data;
      originalJson.call(this, data);
    };

    // Run this logic AFTER the response has been sent to the client
    res.on('finish', () => {
      // Only log successful operations (status codes 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        
        // Strip out passwords if they exist in the payload
        const details = { ...req.body };
        if (details.password) delete details.password;

        // Try to get the entity ID from URL params or the response object
        const entityId = req.params.id || (res.locals.responseData && res.locals.responseData.id) || null;
        
        // Determine user ID (0 for system, or the actual logged in user)
        const userId = req.user ? req.user.id : null;

        const insertLog = db.prepare(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details_json, ip_address) 
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertLog.run(userId, action, entityType, entityId, JSON.stringify(details), req.ip);
      }
    });

    next();
  };
};

module.exports = { auditLogger };