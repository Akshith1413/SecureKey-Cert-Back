# 🔐 SCKLMS - Secure Certificate & Key Lifecycle Management System

A **professional, enterprise-grade MERN stack application** for managing cryptographic certificates and keys with stunning UI, advanced security features, and comprehensive audit logging.

## ✨ Features

### 🔑 Core Functionality
- **Certificate Management**: Create, view, update, revoke, and delete X.509 certificates
- **Key Management**: Generate, rotate, revoke cryptographic keys (RSA, AES, ECDSA, EdDSA)
- **Encryption & Decryption**: AES-256-GCM encryption for sensitive data
- **Digital Signatures**: Sign and verify data using RSA-SHA256
- **Key Rotation**: Automated and manual key rotation with policy management

### 👥 Authentication & Authorization
- **Multi-Factor Authentication (MFA)**: TOTP-based 2FA with backup codes
- **Role-Based Access Control**: Security Admin, Developer, Auditor roles
- **Granular Permissions**: 11+ permission types for fine-grained access control
- **Session Management**: Secure JWT-based authentication with automatic logout
- **Account Security**: Password hashing (bcrypt), account lockout after failed attempts

### 📊 Audit & Compliance
- **Comprehensive Audit Logging**: 25+ audit events tracked with severity levels
- **User Activity Monitoring**: Track all user actions with timestamps and IP addresses
- **Export Capabilities**: Export audit logs as CSV for compliance reporting
- **Audit Statistics**: Real-time dashboard showing top users and action breakdowns
- **TTL-based Log Retention**: Automatic cleanup of logs after 90 days

### 🎨 Beautiful UI/UX
- **Modern Design**: Dark theme with gradient accents and glass-morphism effects
- **Smooth Animations**: Framer Motion for professional transitions and micro-interactions
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Real-time Charts**: Recharts integration for activity visualization
- **Toast Notifications**: React Hot Toast for non-intrusive user feedback

### 🛡️ Security Features
- **End-to-End Encryption**: AES-256-GCM for data encryption
- **Secure Key Storage**: Encrypted private key storage in database
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configurable CORS for API security
- **Secure Headers**: HTTP-only cookies and security headers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 5.0+ (local or cloud)

### Installation

#### 1. Clone and Setup
```bash
# Clone the repository
git clone <repo-url>
cd scklms

# Create necessary directories
mkdir -p backend frontend
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# MONGODB_URI=mongodb://localhost:27017/scklms
# JWT_SECRET=your_secure_secret_key_here
# PORT=5000
# FRONTEND_URL=http://localhost:3000

# Start MongoDB (if local)
# mongod

# Start the backend server
npm run dev
# Or for production:
npm start
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
# VITE_API_URL=http://localhost:5000/api

# Start the development server
npm run dev
# Visit: http://localhost:3000
```

## 📋 API Endpoints

### Authentication
```
POST   /api/auth/register           - Register new user
POST   /api/auth/login              - Login user
POST   /api/auth/logout             - Logout user
POST   /api/auth/change-password    - Change password
POST   /api/auth/mfa/setup          - Setup MFA
POST   /api/auth/mfa/verify         - Verify MFA setup
POST   /api/auth/mfa/validate       - Validate MFA during login
```

### Certificates
```
GET    /api/certificates            - Get all certificates
GET    /api/certificates/:id        - Get certificate details
POST   /api/certificates            - Create certificate
PUT    /api/certificates/:id        - Update certificate
DELETE /api/certificates/:id        - Delete certificate
POST   /api/certificates/:id/revoke - Revoke certificate
```

### Cryptographic Keys
```
GET    /api/keys                    - Get all keys
GET    /api/keys/:id                - Get key details
POST   /api/keys/generate           - Generate new key
POST   /api/keys/:id/rotate         - Rotate key
POST   /api/keys/:id/revoke         - Revoke key
DELETE /api/keys/:id                - Delete key
POST   /api/keys/encrypt            - Encrypt data
```

### Audit Logs
```
GET    /api/audit-logs              - Get audit logs
GET    /api/audit-logs/:id          - Get log details
GET    /api/audit-logs/user/:userId - Get user's logs
GET    /api/audit-logs/stats/summary - Get statistics
GET    /api/audit-logs/export       - Export as CSV
```

### User Management
```
GET    /api/users/profile           - Get current user profile
GET    /api/users                   - Get all users (Admin only)
GET    /api/users/:id               - Get user details (Admin only)
PUT    /api/users/:id               - Update user (Admin only)
DELETE /api/users/:id               - Delete user (Admin only)
POST   /api/users/:id/disable       - Disable/activate user (Admin only)
POST   /api/users/:id/reset-mfa     - Reset MFA (Admin only)
```

## 🔐 User Roles & Permissions

### Security Admin
- Full access to all features
- User management
- System configuration
- Audit log access

### Developer
- View and create certificates
- Generate and use keys
- Encrypt/decrypt data
- Create keys

### Auditor
- View-only access to certificates and keys
- Full audit log access
- Export capabilities
- Analytics dashboard

## 🗂️ Project Structure

```
scklms/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Certificate.js
│   │   ├── CryptoKey.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── certificates.js
│   │   ├── keys.js
│   │   ├── users.js
│   │   └── auditLogs.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   ├── encryption.js
│   │   └── auditLogger.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Certificates.jsx
│   │   │   ├── Keys.jsx
│   │   │   └── AuditLogs.jsx
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md
```

## 🎨 Design & Animations

- **Modern Dark Theme**: Slate and gradient color scheme
- **Smooth Transitions**: Framer Motion animations throughout
- **Glass-morphism Effects**: Frosted glass UI components
- **Loading States**: Spinner animations and skeleton screens
- **Interactive Charts**: Real-time Recharts visualizations

## 🔒 Security Considerations

1. **Encryption**: All sensitive keys are encrypted with AES-256-GCM
2. **Password Hashing**: bcryptjs with salt rounds = 10
3. **Token Management**: JWT with 24-hour expiration
4. **Input Validation**: Server-side validation on all endpoints
5. **CORS**: Strict origin checking
6. **MFA**: Time-based OTP (TOTP) with backup codes
7. **Audit Trail**: Comprehensive logging of all actions
8. **Rate Limiting**: Implement rate limiting in production

## 📦 Dependencies

### Backend
- Express.js - Web framework
- MongoDB/Mongoose - Database
- JWT - Authentication
- bcryptjs - Password hashing
- Speakeasy - MFA/TOTP
- QRCode - QR code generation
- Crypto - Cryptographic operations

### Frontend
- React 18 - UI framework
- React Router - Client-side routing
- Framer Motion - Animations
- Tailwind CSS - Styling
- Recharts - Data visualization
- Axios - HTTP client
- React Hot Toast - Notifications

## 🚀 Deployment

### Backend (Example: Heroku)
```bash
cd backend
heroku create your-app-name
git push heroku main
```

### Frontend (Example: Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

## 📝 Demo Credentials

For testing purposes:
```
Email: admin@scklms.com
Password: Admin@123456
Role: Security Admin
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Support

For support, email support@scklms.com or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Hardware security module (HSM) integration
- [ ] Certificate revocation list (CRL) support
- [ ] OCSP (Online Certificate Status Protocol)
- [ ] Advanced key derivation functions
- [ ] Real-time notifications
- [ ] Mobile app
- [ ] Advanced analytics dashboard
- [ ] Integration with external certificate authorities

---

**Made with ❤️ for secure key and certificate management**
