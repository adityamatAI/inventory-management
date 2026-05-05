const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Use DB_PATH from .env or default to database.db in the backend folder
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');

// 1. Create the Singleton DB instance
const db = new Database(dbPath, { verbose: console.log });

// 2. Enforce Foreign Key constraints in SQLite
db.pragma('foreign_keys = ON');

// 3. Define the Schema Initialization function
const initializeDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL REFERENCES roles(id),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_email TEXT,
      user_id INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      current_qty INTEGER NOT NULL DEFAULT 0,
      min_threshold INTEGER NOT NULL,
      refill_qty INTEGER NOT NULL,
      supplier_id INTEGER REFERENCES suppliers(id),
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS replenishment_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES items(id),
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
      requested_qty INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      manager_notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES items(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      change_qty INTEGER NOT NULL,
      reason TEXT,
      transaction_type TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('Database tables verified/initialized successfully.');
};

module.exports = { db, initializeDB };