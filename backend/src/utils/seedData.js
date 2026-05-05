const { db, initializeDB } = require('../config/database');
const bcrypt = require('bcryptjs');

console.log('Initializing DB Schema...');
initializeDB();

console.log('Seeding Data...');

// 1. Seed Roles
const roles =['admin', 'manager', 'staff', 'supplier'];
const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name) VALUES (?, ?)');
roles.forEach((role, index) => {
    insertRole.run(index + 1, role);
});

// 2. Seed Users
// Project spec: admin user (username: admin, password: admin123)
const adminPassword = bcrypt.hashSync('admin123', 10);
const defaultPassword = bcrypt.hashSync('password123', 10);

const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password_hash, role_id) 
    VALUES (?, ?, ?, ?)
`);

// role_id mapping: 1=admin, 2=manager, 3=staff, 4=supplier
insertUser.run(1, 'admin', adminPassword, 1);
insertUser.run(2, 'manager_alice', defaultPassword, 2);
insertUser.run(3, 'staff_bob', defaultPassword, 3);
insertUser.run(4, 'supplier_vendor', defaultPassword, 4);
// The 'System' user (id=0) for automated audit logs and requests
db.prepare(`INSERT OR IGNORE INTO users (id, username, password_hash, role_id) VALUES (0, 'System', '', 1)`).run();


// 3. Seed Suppliers
const insertSupplier = db.prepare(`
    INSERT OR IGNORE INTO suppliers (id, name, contact_email, user_id) 
    VALUES (?, ?, ?, ?)
`);
// Linking this supplier entity to the supplier_vendor user account (id=4)
insertSupplier.run(1, 'Fresh Farms Co.', 'orders@freshfarms.com', 4);
insertSupplier.run(2, 'Global Groceries', 'supply@globalgroceries.com', null);

// 4. Seed Items
const insertItem = db.prepare(`
    INSERT OR IGNORE INTO items (id, name, sku, current_qty, min_threshold, refill_qty, supplier_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);
insertItem.run(1, 'Organic Apples', 'APP-001', 50, 20, 100, 1);
insertItem.run(2, 'Whole Milk 1L', 'MILK-001', 10, 15, 50, 1);  // Below threshold!
insertItem.run(3, 'Basmati Rice 5kg', 'RICE-005', 5, 10, 20, 2);   // Below threshold!
insertItem.run(4, 'Canned Beans', 'BEAN-001', 100, 30, 200, 2);

console.log('--------------------------------------------------');
console.log('Seeding completed successfully!');
console.log('Test Accounts Created:');
console.log('Admin: admin / admin123');
console.log('Manager: manager_alice / password123');
console.log('Staff: staff_bob / password123');
console.log('Supplier: supplier_vendor / password123');
console.log('--------------------------------------------------');