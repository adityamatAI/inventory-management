# SmartStock — Inventory Management System

A full-stack inventory management system built for a college project. SmartStock automates the replenishment workflow for a retail/warehouse environment — from stock deduction by staff, through manager approval, to supplier fulfillment and receipt confirmation. Every action is logged in a full audit trail.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | SQLite (via `better-sqlite3`) |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Dev tooling | `concurrently`, `nodemon` |

**Architecture:** Layered Monolith — `routes (controllers) → models → SQLite`

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm

### 1. Clone & Install

```bash
# Install root dependencies (concurrently)
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment

The `backend/.env` file is already set up. If it doesn't exist, create it:

```env
PORT=3001
JWT_SECRET=your_secret_key_here
DB_PATH=./database.db
```

### 3. Seed the Database

Run this once to create all tables and populate demo data:

```bash
cd backend
node src/utils/seedData.js
cd ..
```

This creates 8 inventory items, 4 users, 2 suppliers, and 5 pre-seeded requests in various states.

### 4. Run the App

```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

---

## Test Accounts

| Role | Username | Password | Access |
|---|---|---|---|
| Admin | `admin` | `admin123` | Full system access — user management, roles, audit log |
| Manager | `manager_alice` | `password123` | Request queue — approve, reject, confirm receipt |
| Staff | `staff_bob` | `password123` | Inventory view + stock deduction |
| Supplier | `supplier_vendor` | `password123` | Their assigned orders — accept, ship, deliver |

---

## Project Structure

```
inventory-management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # SQLite connection + schema initialization
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification → attaches req.user
│   │   │   ├── rbac.js            # allowRoles() factory — role-based access control
│   │   │   └── auditLogger.js     # Writes every protected action to audit_logs table
│   │   ├── models/
│   │   │   ├── itemModel.js       # Item query helpers (maps to UML Class Diagram)
│   │   │   ├── requestModel.js    # ReplenishmentRequest query helpers
│   │   │   └── userModel.js       # User & Role query helpers
│   │   ├── routes/
│   │   │   ├── auth.js            # POST /login, POST /logout
│   │   │   ├── items.js           # Full CRUD for inventory items
│   │   │   ├── stock.js           # POST /deduct — triggers threshold checker
│   │   │   ├── requests.js        # approve, reject, confirm-receipt
│   │   │   ├── supplier.js        # Supplier order status updates
│   │   │   └── admin.js           # User management + audit log (admin only)
│   │   └── utils/
│   │       ├── thresholdChecker.js  # Observer pattern — auto-generates requests
│   │       └── seedData.js          # Demo data seeder
│   ├── .env
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/
│       │   └── axiosInstance.js   # Base URL + JWT interceptor
│       ├── components/
│       │   ├── Navbar.jsx          # Role-aware navigation bar
│       │   ├── ProtectedRoute.jsx  # Route guard by role
│       │   └── ErrorBoundary.jsx   # Catches runtime errors per dashboard
│       ├── context/
│       │   └── AuthContext.jsx    # Global auth state (user, login, logout)
│       └── pages/
│           ├── Login.jsx
│           ├── staff/
│           │   ├── Dashboard.jsx  # Inventory table with low-stock highlighting
│           │   └── StockDeduct.jsx
│           ├── manager/
│           │   └── ManagerDashboard.jsx  # Request queue — approve/reject/confirm
│           ├── supplier/
│           │   └── SupplierDashboard.jsx # Order portal — accept/ship/deliver
│           └── admin/
│               ├── AdminDashboard.jsx    # Tabbed hub
│               ├── UserManagement.jsx    # Create/edit/deactivate users
│               └── RoleManagement.jsx    # Assign roles to users
```

---

## Core Workflow

### The Full Replenishment Cycle

```
Staff deducts stock
       ↓
thresholdChecker runs automatically
       ↓ (if stock ≤ min_threshold)
Replenishment request auto-generated [status: pending]
       ↓
Manager reviews → Approve (with notes)
       ↓
Request forwarded to supplier [status: forwarded]
       ↓
Supplier accepts order [status: accepted]
       ↓
Supplier marks as sent [status: sent]
       ↓
Supplier marks as delivered [status: delivered]
       ↓
Manager confirms receipt
       ↓
Stock quantity updated in DB [status: closed]
✓ Audit log records every step
```

### Request Status State Machine

```
pending → forwarded → accepted → sent → delivered → closed
pending → rejected  (terminal)
```
Illegal transitions (e.g. jumping from `pending` to `delivered`) are blocked at the API level.

---

## Key Features

### Role-Based Access Control (RBAC)
Every API route is protected by the `allowRoles()` middleware. Each role sees only what they're permitted to:
- **Staff** — inventory view + stock deductions only
- **Manager** — full request lifecycle management
- **Supplier** — only their own assigned orders
- **Admin** — everything, plus user/role management

### Automatic Threshold Detection
`thresholdChecker.js` runs after every stock deduction. If stock drops at or below `min_threshold`, it automatically creates a replenishment request — no manual intervention needed. Duplicate requests are prevented (won't create a new one if an open request already exists).

### Audit Trail
Every write action (login, logout, stock deduction, request state change, user creation) is recorded in the `audit_logs` table with timestamp, user, action type, and entity reference. Admins can filter the audit log by username, action type, and date range.

### Admin Panel
- **Users tab** — create new users (username/password/role), edit existing users, activate/deactivate accounts
- **Roles tab** — reassign any user's role with a dropdown; changes take effect immediately
- **Audit Log tab** — paginated log with filters for username, action type, and date range

---

## Database Schema

| Table | Purpose |
|---|---|
| `roles` | 4 roles: admin, manager, staff, supplier |
| `users` | User accounts with bcrypt-hashed passwords |
| `suppliers` | Supplier profiles, linked to supplier user accounts |
| `items` | Inventory items with SKU, quantity, threshold, refill qty |
| `replenishment_requests` | Full request lifecycle with status and manager notes |
| `stock_transactions` | Record of every stock deduction and restock event |
| `audit_logs` | Immutable log of every system action |

---

## Design Patterns Used

| Pattern | Where |
|---|---|
| **Chain of Responsibility** | Middleware chain: `verifyToken → allowRoles → auditLogger` |
| **Observer** | `thresholdChecker.js` — reacts to stock changes automatically |
| **State Machine** | Request status transitions enforced in `routes/requests.js` and `routes/supplier.js` |
| **Layered Architecture** | routes (controllers) → models → database |
| **Repository / Model** | `models/` directory — query logic separated from route handlers |