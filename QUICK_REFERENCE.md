# ⚡ SCKLMS Quick Reference Guide

## 🚀 Start the Application (2 Commands)

### Terminal 1 - Backend
```bash
cd backend
npm install    # First time only
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install    # First time only
npm run dev
```

Then open: **http://localhost:3000**

---

## 👤 Default Login Credentials

```
Email:    admin@scklms.com
Password: Admin@123456
```

---

## 🎯 Main Features Quick Links

| Feature | URL | Role Required |
|---------|-----|---------------|
| Dashboard | `/dashboard` | All |
| Certificates | `/certificates` | All |
| Keys | `/keys` | All |
| Audit Logs | `/audit-logs` | Auditor+ |
| User Management | In settings | Admin Only |

---

## 🔑 User Roles

### 👑 Security Admin
```
Full access to everything
✓ Create/Delete certificates & keys
✓ Manage users and permissions
✓ View all audit logs
✓ Export security data
```

### 👨‍💻 Developer
```
Can work with own resources
✓ Create certificates & keys
✓ Use keys for encryption
✓ View limited audit logs
✗ Cannot manage users
✗ Cannot access all audit logs
```

### 🔍 Auditor
```
Read-only observer
✓ View all certificates & keys
✓ Full audit log access
✓ Export logs as CSV
✗ Cannot create anything
✗ Cannot delete anything
```

---

## 📚 Key Concepts

### 🔐 Certificates
- X.509 digital certificates
- Track validity and status
- Revoke when compromised
- View certificate chain

### 🔑 Cryptographic Keys
- RSA (2048/4096 bits) - Asymmetric
- AES (128/192/256 bits) - Symmetric
- ECDSA/EdDSA - Alternative algorithms
- Automatic rotation policies

### 🔒 Encryption
- AES-256-GCM for data
- RSA-2048 for key exchange
- SHA-256 for hashing
- All keys encrypted at rest

### 📊 Audit Logs
- Track all user actions
- Severity levels (critical→low)
- Filter by action, user, date
- Export for compliance

---

## 🔧 API Examples

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@scklms.com",
    "password": "Admin@123456"
  }'
```

### Create Certificate
```bash
curl -X POST http://localhost:5000/api/certificates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Certificate",
    "certificateData": "-----BEGIN CERTIFICATE-----...",
    "issuer": "CA Name",
    "validUntil": "2025-12-31T23:59:59Z"
  }'
```

### Generate Key
```bash
curl -X POST http://localhost:5000/api/keys/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My RSA Key",
    "keyType": "RSA",
    "keyLength": 2048
  }'
```

### Get Audit Logs
```bash
curl -X GET "http://localhost:5000/api/audit-logs?severity=critical" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting Checklist

### Can't start backend?
```bash
□ MongoDB running? mongosh
□ Port 5000 free? lsof -ti:5000
□ Dependencies installed? npm install
□ .env file created? cp .env.example .env
```

### Can't start frontend?
```bash
□ Port 3000 free? lsof -ti:3000
□ Dependencies installed? npm install
□ Backend running? curl http://localhost:5000/api/health
□ .env configured? VITE_API_URL set correctly
```

### Can't login?
```bash
□ Is backend running? Check terminal
□ Can reach API? curl http://localhost:5000/api/health
□ Database has data? mongosh → use scklms → db.users.count()
□ Correct credentials? admin@scklms.com / Admin@123456
```

### Strange UI issues?
```bash
□ Clear browser cache? Ctrl+Shift+Delete
□ Hard refresh? Ctrl+Shift+R
□ Check console errors? F12 → Console tab
□ Restart frontend? Ctrl+C then npm run dev
```

---

## 📁 Important Files

### Backend
```
backend/server.js              Main server file
backend/.env                   Configuration
backend/models/User.js         User schema & auth
backend/routes/auth.js         Login/signup logic
backend/utils/encryption.js    All crypto operations
```

### Frontend
```
frontend/src/App.jsx           Main routing
frontend/src/pages/Login.jsx   Login page
frontend/src/context/AuthContext.jsx  Auth state
frontend/src/services/api.js   API client
frontend/.env                  API configuration
```

---

## 🔐 Security Best Practices

### For Production
```bash
□ Change JWT_SECRET in backend/.env
□ Set NODE_ENV=production
□ Enable HTTPS
□ Set secure CORS origins
□ Use strong database passwords
□ Enable MongoDB authentication
□ Configure firewall rules
□ Regular backups of MongoDB
□ Monitor audit logs regularly
```

---

## 📊 Database Collections

```
┌─────────────────────────────────────┐
│         SCKLMS Database             │
├─────────────────────────────────────┤
│ users          - User accounts      │
│ certificates   - X.509 certs       │
│ cryptokeys     - Encryption keys    │
│ auditlogs      - Activity logs      │
└─────────────────────────────────────┘
```

### View in MongoDB
```bash
mongosh
> use scklms
> db.users.find()
> db.certificates.count()
> db.cryptokeys.find()
> db.auditlogs.find({ severity: "critical" })
```

---

## ⚙️ Common Configurations

### Change Backend Port
```
backend/.env:
PORT=8000
```

### Change Frontend API URL
```
frontend/.env:
VITE_API_URL=http://your-api.com/api
```

### Adjust JWT Expiration
```
backend/routes/auth.js:
expiresIn: '48h'  // Change from '24h'
```

### Modify Key Rotation Policy
```
backend/routes/keys.js:
'180days': new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
```

---

## 📱 Frontend Routes

```
/login              - Login page
/register           - Registration page
/dashboard          - Main dashboard
/certificates       - Certificate management
/keys               - Key management
/audit-logs         - Audit log viewer
```

---

## 🎨 UI Customization Quick Tips

### Change Color Scheme
Edit `frontend/tailwind.config.js`:
```javascript
colors: {
  primary: '#YOUR_COLOR',
  secondary: '#YOUR_COLOR',
  accent: '#YOUR_COLOR',
}
```

### Change Dark Theme
Edit `frontend/src/index.css`:
```css
body {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Adjust Animation Speed
Edit `frontend/src/index.css`:
```css
@keyframes fadeIn {
  animation: fadeIn 0.3s ease-in-out; /* Change 0.5s to any value */
}
```

---

## 📞 Support Resources

### Get Health Status
```bash
curl http://localhost:5000/api/health
```

### Test Database Connection
```bash
mongosh
> db.adminCommand('ping')
```

### Monitor Logs in Real-time
```bash
# Backend logs show in terminal where you ran npm run dev
# Frontend logs show in browser DevTools (F12)
```

---

## 🚀 Deploy in 5 Minutes

### To Heroku (Backend)
```bash
cd backend
heroku create your-app
git push heroku main
```

### To Vercel (Frontend)
```bash
cd frontend
npm run build
vercel --prod
```

---

## 💡 Pro Tips

1. **Use MFA**: Enable 2FA for admin accounts
2. **Regular Audits**: Check audit logs weekly
3. **Key Rotation**: Rotate keys every 90 days
4. **Backup Data**: Regular MongoDB backups
5. **Monitor Logs**: Critical events need attention
6. **Update Dependencies**: Keep npm packages current
7. **Test MFA**: Verify backup codes work
8. **Document Changes**: Keep track of modifications

---

## 🎯 Common Tasks

### Create New User (as Admin)
1. Login as admin
2. Go to User Management
3. Click "Add User"
4. Set role and permissions
5. Send credentials securely

### Rotate a Key
1. Go to Keys page
2. Find key to rotate
3. Click "Rotate" button
4. Old key marked as "rotated"
5. New key marked as "active"

### Export Audit Logs
1. Go to Audit Logs
2. Filter as needed
3. Click "Export CSV"
4. File downloads
5. Open in Excel/Sheets

### Enable MFA for User
1. Login as that user
2. Go to Settings
3. Click "Setup MFA"
4. Scan QR code
5. Enter code to verify
6. Save backup codes

---

## 🔄 Common Workflows

### User Registration Flow
```
User clicks "Sign up"
  ↓
Fills form with name, email, password
  ↓
Selects role (Developer or Auditor)
  ↓
Backend validates & creates account
  ↓
Permissions assigned based on role
  ↓
Login immediately with JWT token
```

### Certificate Creation Flow
```
User clicks "Add Certificate"
  ↓
Fills in certificate details
  ↓
Pastes certificate data (PEM format)
  ↓
Validates certificate uniqueness
  ↓
Stores in database
  ↓
Logs CREATE_CERT audit event
```

### MFA Setup Flow
```
User clicks "Setup MFA"
  ↓
Backend generates secret
  ↓
Frontend displays QR code
  ↓
User scans with authenticator app
  ↓
User enters code to verify
  ↓
Backup codes generated
  ↓
MFA enabled on account
```

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Production Ready ✅

For detailed documentation, see **README.md** and **SETUP.md**
