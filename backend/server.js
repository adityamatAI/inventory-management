const express = require('express');
const cors = require('cors');
const path =require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const { initializeDB } = require('./src/config/database');
const authRoutes = require('./src/routes/auth');
const itemRoutes = require('./src/routes/items');
const stockRoutes = require('./src/routes/stock');
const requestRoutes = require('./src/routes/requests');
const supplierRoutes = require('./src/routes/supplier');
const adminRoutes = require('./src/routes/admin');

// --- APP INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- DATABASE INITIALIZATION ---
// This ensures the database and tables are created before the server starts.
initializeDB();

// --- MIDDLEWARE SETUP ---
// 1. CORS: Allow requests from our React frontend (running on a different port)
app.use(cors({
  origin: 'http://localhost:5173' // Your Vite dev server URL
}));

// 2. Body Parser: To handle JSON request bodies
app.use(express.json());

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
// We will add other routes (items, requests, etc.) here in later phases.

app.use('/api/items', itemRoutes);
app.use('/api/stock', stockRoutes);

app.use('/api/requests', requestRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/admin', adminRoutes);

// A simple health check route
app.get('/', (req, res) => {
  res.send('Smart Stock Monitoring API is running!');
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});