# 📁 SCKLMS Complete Project Structure

## Root Directory
```
scklms/
├── README.md                      # Main project documentation
├── SETUP.md                       # Installation & setup guide
├── QUICK_REFERENCE.md            # Quick start and common tasks
├── PROJECT_SUMMARY.md            # Complete feature breakdown
├── PROJECT_STRUCTURE.md          # This file
│
├── backend/                       # Node.js/Express backend
│   ├── models/
│   │   ├── User.js               # User schema with auth
│   │   ├── Certificate.js         # Certificate data model
│   │   ├── CryptoKey.js          # Cryptographic key model
│   │   └── AuditLog.js           # Audit trail model
│   │
│   ├── routes/
│   │   ├── auth.js               # Authentication endpoints
│   │   ├── certificates.js        # Certificate CRUD operations
│   │   ├── keys.js               # Key generation & management
│   │   ├── users.js              # User management (admin)
│   │   └── auditLogs.js          # Audit log queries
│   │
│   ├── middleware/
│   │   └── auth.js               # JWT verification & RBAC
│   │
│   ├── utils/
│   │   ├── encryption.js         # Crypto operations (AES, RSA, SHA-256)
│   │   └── auditLogger.js        # Audit event logging
│   │
│   ├── server.js                 # Main Express server
│   ├── package.json              # Backend dependencies
│   ├── .env.example              # Environment variables template
│   └── .env                       # Configuration (create from example)
│
└── frontend/                      # React/Vite frontend
    ├── public/
    │   └── vite.svg              # Vite logo
    │
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx          # Login/signin page
    │   │   ├── Register.jsx        # User registration page
    │   │   ├── Dashboard.jsx       # Main dashboard with charts
    │   │   ├── Certificates.jsx    # Certificate management UI
    │   │   ├── Keys.jsx           # Key management UI
    │   │   └── AuditLogs.jsx      # Audit log viewer
    │   │
    │   ├── components/
    │   │   └── Layout.jsx         # Main layout with sidebar
    │   │
    │   ├── context/
    │   │   └── AuthContext.jsx    # Authentication state management
    │   │
    │   ├── services/
    │   │   └── api.js             # Axios API client
    │   │
    │   ├── App.jsx                # Main React app & routing
    │   ├── main.jsx               # React DOM mount point
    │   └── index.css              # Tailwind CSS & animations
    │
    ├── index.html                 # HTML entry point
    ├── package.json               # Frontend dependencies
    ├── vite.config.js             # Vite bundler config
    ├── tailwind.config.js         # Tailwind CSS config
    ├── postcss.config.js          # PostCSS config
    ├── .env.example               # Environment variables template
    └── .env                       # Configuration (create from example)
```

---

## 📊 Detailed File Documentation

### Backend Files

#### `backend/server.js` (108 lines)
Main Express server initialization with:
- MongoDB connection setup
- Middleware configuration (CORS, JSON parsing)
- Route mounting
- Error handling
- Server startup logic

#### `backend/models/User.js` (98 lines)
User schema with:
- Authentication fields (email, password)
- Profile information
- Role & permissions
- MFA setup (TOTP secret, backup codes)
- Account security (lockout, login attempts)
- Password hashing pre-hook

#### `backend/models/Certificate.js` (67 lines)
Certificate schema for X.509 certificates:
- Certificate data & hash
- Validity dates
- Issuer & subject information
- Status tracking
- Access control
- Encryption metadata

#### `backend/models/CryptoKey.js` (80 lines)
Cryptographic key schema:
- Key type (RSA, AES, ECDSA, EdDSA)
- Public/private key storage (encrypted)
- Key rotation policies
- Status tracking
- Access control with granular permissions
- Encryption method tracking

#### `backend/models/AuditLog.js` (82 lines)
Audit trail schema:
- Action tracking (25+ actions)
- User information
- Resource details
- Severity levels
- Request metadata (IP, user-agent)
- 90-day TTL for automatic cleanup

#### `backend/middleware/auth.js` (57 lines)
Authentication middleware:
- JWT verification
- User authentication
- Role-based authorization
- Permission checking
- Automatic logout on token expiration

#### `backend/utils/encryption.js` (113 lines)
Cryptographic utilities:
- RSA key pair generation
- AES symmetric key generation
- AES-256-GCM encryption/decryption
- SHA-256 hashing
- RSA digital signatures
- Signature verification
- Secure random string generation

#### `backend/utils/auditLogger.js` (54 lines)
Audit logging utilities:
- Log creation with automatic field population
- Severity determination by action
- User & resource tracking
- Error handling

#### `backend/routes/auth.js` (436 lines)
Authentication endpoints:
- User registration with role assignment
- Login with MFA checking
- MFA setup with QR code generation
- MFA validation with TOTP & backup codes
- Logout
- Password change
- Automatic account lockout
- Backup code management

#### `backend/routes/certificates.js` (308 lines)
Certificate management endpoints:
- Get all certificates (with filtering)
- Get single certificate
- Create new certificate
- Update certificate
- Delete certificate
- Revoke certificate
- Access control checking
- Audit logging

#### `backend/routes/keys.js` (446 lines)
Cryptographic key endpoints:
- Get all keys (with filtering by type/status)
- Get single key
- Generate new keys (RSA, AES, ECDSA)
- Rotate keys with new generation
- Revoke keys
- Delete keys
- Encrypt data with keys
- Key policy management
- Access control

#### `backend/routes/users.js` (261 lines)
User management endpoints (Admin only):
- Get user profile
- Get all users
- Get single user
- Update user details & permissions
- Delete user (with last-admin protection)
- Disable/activate accounts
- Reset MFA for users
- Audit logging

#### `backend/routes/auditLogs.js` (272 lines)
Audit log endpoints:
- Get all logs with advanced filtering
- Get logs for specific user
- Get logs for specific resource
- Export logs as CSV
- Get statistics and summary
- Pagination support
- Audit event tracking

#### `backend/package.json` (28 lines)
Backend dependencies:
- express (web framework)
- mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- speakeasy (TOTP/MFA)
- qrcode (QR code generation)
- cors (cross-origin requests)
- dotenv (environment variables)
- nodemon (dev server reloading)

#### `backend/.env.example` (6 lines)
Environment configuration template:
- MongoDB URI
- JWT secret key
- Server port
- Node environment
- Frontend URL for CORS

---

### Frontend Files

#### `frontend/src/App.jsx` (110 lines)
Main React application with:
- Router setup
- Protected routes
- Authentication provider
- Toast notifications
- Loading states

#### `frontend/src/main.jsx` (11 lines)
React DOM entry point:
- Mounts App to #root element
- Strict mode enabled

#### `frontend/src/index.css` (154 lines)
Global styles with:
- Tailwind CSS imports
- CSS reset
- Custom animations (fade, slide, pulse)
- Glass-morphism effects
- Utility classes (btn-primary, input-field, etc.)
- Loading spinner animation
- Custom scrollbar styling

#### `frontend/src/context/AuthContext.jsx` (198 lines)
Authentication context:
- User state management
- Login/logout functions
- Registration function
- MFA setup & validation
- Password change
- Token management
- Auto-logout on 401 errors

#### `frontend/src/services/api.js` (40 lines)
Axios API client:
- Base URL configuration
- Request interceptors (token injection)
- Response interceptors (error handling)
- CORS configuration
- Automatic redirect on 401

#### `frontend/src/pages/Login.jsx` (222 lines)
Login page with:
- Email & password form
- Validation with error messages
- Loading states
- MFA redirect
- Register link
- Demo credentials display
- Smooth animations

#### `frontend/src/pages/Register.jsx` (267 lines)
Registration page with:
- Name, email, password fields
- Role selection (Developer/Auditor)
- Password strength validation
- Form validation with error messages
- Loading states
- Login link
- Smooth animations

#### `frontend/src/pages/Dashboard.jsx` (260 lines)
Main dashboard with:
- Welcome message
- Statistics cards (certs, keys, activity)
- Weekly activity line chart
- Key status pie chart
- Recent activity feed
- Real-time data fetching
- Multiple role support

#### `frontend/src/pages/Certificates.jsx` (348 lines)
Certificate management UI with:
- Certificate list table
- Search functionality
- Status filtering
- Create modal form
- Delete functionality
- Revoke functionality
- Status indicators
- Responsive design

#### `frontend/src/pages/Keys.jsx` (363 lines)
Key management UI with:
- Key list table
- Search and filter
- Generate key modal
- Key type selection
- Key length options
- Rotate, revoke, delete actions
- Status tracking
- Real-time updates

#### `frontend/src/pages/AuditLogs.jsx` (277 lines)
Audit log viewer with:
- Log filtering by action/severity
- Search functionality
- Statistics cards
- CSV export
- Real-time log display
- Severity color coding
- Pagination support
- Detailed timestamps

#### `frontend/src/components/Layout.jsx` (155 lines)
Main layout component with:
- Responsive sidebar
- Mobile toggle
- Navigation menu (role-based)
- Top bar with user info
- Logout button
- Settings access
- Smooth animations
- Sidebar auto-close on mobile

#### `frontend/index.html` (15 lines)
HTML entry point:
- Meta tags for SEO
- Viewport configuration
- Root element (#root)
- Vite module script

#### `frontend/package.json` (31 lines)
Frontend dependencies:
- react (UI framework)
- react-router-dom (routing)
- axios (HTTP client)
- framer-motion (animations)
- recharts (charts)
- tailwindcss (styling)
- vite (build tool)
- lucide-react (icons)
- react-hot-toast (notifications)
- date-fns (date utilities)

#### `frontend/vite.config.js` (21 lines)
Vite build configuration:
- React plugin
- Dev server port (3000)
- API proxy setup
- Build optimization

#### `frontend/tailwind.config.js` (32 lines)
Tailwind CSS configuration:
- Color theme
- Custom animations
- Font configuration
- Border radius

#### `frontend/postcss.config.js` (7 lines)
PostCSS configuration:
- Tailwind CSS plugin
- Autoprefixer plugin

#### `frontend/.env.example` (2 lines)
Environment template:
- API URL configuration

---

## 📊 Code Statistics

| Category | Count | Size |
|----------|-------|------|
| Backend Files | 12 | ~2000 lines |
| Frontend Files | 10+ | ~1500 lines |
| API Endpoints | 30+ | Fully functional |
| Database Models | 4 | Complete schemas |
| UI Pages | 6 | Fully responsive |
| Components | 1 (Layout) + 6 (Pages) | Modular |
| Authentication Methods | 3 | Password + MFA + JWT |
| Audit Actions | 25+ | Comprehensive |
| User Roles | 3 | RBAC implemented |
| Permissions | 11+ | Granular control |

---

## 🔄 Key Relationships

### File Dependencies

```
server.js
├── models/User.js
├── models/Certificate.js
├── models/CryptoKey.js
├── models/AuditLog.js
├── routes/auth.js
├── routes/certificates.js
├── routes/keys.js
├── routes/users.js
├── routes/auditLogs.js
├── middleware/auth.js
├── utils/encryption.js
└── utils/auditLogger.js

App.jsx
├── context/AuthContext.jsx
├── pages/Login.jsx
├── pages/Register.jsx
├── pages/Dashboard.jsx
├── pages/Certificates.jsx
├── pages/Keys.jsx
├── pages/AuditLogs.jsx
├── components/Layout.jsx
└── services/api.js
```

---

## 📥 Import Structure

### Backend Imports
```javascript
// Models
import User from '../models/User.js'
import Certificate from '../models/Certificate.js'
import CryptoKey from '../models/CryptoKey.js'
import AuditLog from '../models/AuditLog.js'

// Middleware
import { protect, authorize, checkPermission } from '../middleware/auth.js'

// Utils
import { encryptAES256, hashData, signData } from '../utils/encryption.js'
import { logAudit } from '../utils/auditLogger.js'
```

### Frontend Imports
```javascript
// Libraries
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

// Context
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Dashboard from './pages/Dashboard'
import Certificates from './pages/Certificates'
import Keys from './pages/Keys'

// Services
import api from './services/api'
```

---

## 🔐 Security Architecture

```
Request Flow:
User Input → Frontend Validation
          ↓
API Request → Axios with JWT token
          ↓
Backend Middleware → JWT verification
                  → Role checking
                  → Permission checking
          ↓
Route Handler → Data validation
             → Business logic
             → Encryption (if needed)
             → Database operation
             → Audit logging
          ↓
Response → JSON response
        → Toast notification (Frontend)
```

---

## 📦 Database Schema Relationships

```
User (1) ──── (Many) AuditLog
  │              └─ Tracks all user actions
  │
  ├─── (Many) Certificate
  │             └─ User-created certificates
  │
  └─── (Many) CryptoKey
                └─ User-generated keys

Certificate (1) ─── (Many) AuditLog
  └─ All cert operations tracked

CryptoKey (1) ─── (Many) AuditLog
  └─ All key operations tracked
```

---

## 🚀 Development Workflow

```
Edit Code (any file)
   ↓
Save file
   ↓
Backend: Nodemon auto-restarts
Frontend: Vite hot-reloads
   ↓
Browser reflects changes
   ↓
Test features
   ↓
Check audit logs
```

---

## 📝 Configuration Files

- `backend/.env` - Backend environment variables
- `frontend/.env` - Frontend environment variables
- `frontend/vite.config.js` - Vite build settings
- `frontend/tailwind.config.js` - Tailwind theming
- `frontend/postcss.config.js` - CSS processing
- `backend/package.json` - Backend dependencies
- `frontend/package.json` - Frontend dependencies

---

## 🎯 Total Project Size

- **Backend Code**: ~2000 lines of JavaScript
- **Frontend Code**: ~1500 lines of JSX
- **Configuration Files**: ~150 lines
- **Documentation**: ~2000 lines
- **Total**: ~5650 lines of code & docs

---

**This complete project structure enables:**
✅ Full-stack development
✅ Scalable architecture
✅ Easy maintenance
✅ Clear code organization
✅ Professional deployment
✅ Security best practices
✅ Comprehensive functionality

See **SETUP.md** for installation instructions!
