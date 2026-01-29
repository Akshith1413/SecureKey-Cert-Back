# ST-CIMP Quick Start Guide

## Installation (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or connection string ready
- Port 5000 and 3000 available

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/stcimp
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
ENCRYPTION_KEY=$(openssl rand -hex 32)
MASTER_ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF

# Start backend server
npm run dev
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000" > .env

# Start frontend server
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

---

## Default Credentials

### Security Authority (Admin)
```
Email: admin@stcimp.com
Password: Admin@123456
Role: security_authority
MFA: Required (use authenticator app)
```

### System Client (Developer)
```
Email: client@stcimp.com
Password: Client@123456
Role: system_client
MFA: Optional
```

### Auditor
```
Email: auditor@stcimp.com
Password: Auditor@123456
Role: auditor
MFA: Required
```

**Note**: Reset passwords in production and use strong credentials!

---

## Test Workflow (15 Minutes)

### Step 1: Login as Security Authority
```
1. Navigate to http://localhost:3000
2. Login with admin@stcimp.com / Admin@123456
3. Scan QR code with authenticator app
4. Enter OTP code
```

### Step 2: Create Trust Authority
```
1. Go to "Trust Authority" section
2. Click "+ Create Authority"
3. Fill in:
   - Name: "Main Trust Authority"
   - Description: "Primary certificate issuing authority"
   - Key Length: 2048
4. Click "Create"
5. Verify Root Key was generated
```

### Step 3: Create Cryptographic Policy
```
1. Go to "Crypto Policies" section
2. Click "+ New Policy"
3. Fill in:
   - Policy Name: "Standard Policy"
   - Trust Authority: "Main Trust Authority"
   - Encryption: AES-256-GCM
   - Hash Algorithm: SHA-256
   - Signing Algorithm: RSA-2048
4. Click "Create"
```

### Step 4: Issue a Certificate
```
1. Go to "Certificates" section
2. Click "+ Request Certificate"
3. Fill in:
   - Name: "Test Certificate"
   - Key Length: 2048
   - Validity: 365 days
4. Submit request
5. As Security Authority, approve the request
6. Check certificate was signed and encrypted
```

### Step 5: Verify File Integrity
```
1. Go to "Verify Files" section
2. Create a test file: echo "Test data" > test.txt
3. Upload the file
4. Enter the Certificate ID from Step 4
5. Click "Verify Integrity"
6. Check results (should show "Valid")
```

### Step 6: Review Audit Logs
```
1. Login as Auditor (auditor@stcimp.com)
2. Go to "Audit Logs"
3. View all actions performed
4. Check log integrity (✓ verified)
5. Export logs as CSV if needed
```

---

## API Examples

### 1. Create Trust Authority
```bash
curl -X POST http://localhost:5000/api/trust-authority/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Authority",
    "description": "Test trust authority",
    "keyLength": 2048
  }'
```

### 2. Create Crypto Policy
```bash
curl -X POST http://localhost:5000/api/crypto-policies/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policyName": "Test Policy",
    "trustAuthorityId": "TRUST_AUTHORITY_ID",
    "encryptionAlgorithm": "aes-256-gcm",
    "hashAlgorithm": "sha256",
    "signingAlgorithm": "RSA-2048"
  }'
```

### 3. Verify File Integrity
```bash
curl -X POST http://localhost:5000/api/verification/verify-integrity \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "certificateId": "CERT_ID",
    "fileData": "Your file content here",
    "providedSignature": "signature_if_available"
  }'
```

### 4. Generate Nonce (for security)
```bash
curl -X POST http://localhost:5000/api/verification/generate-nonce \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Check Replay Attack
```bash
curl -X POST http://localhost:5000/api/verification/check-replay \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nonce": "NONCE_FROM_STEP_4"
  }'
```

### 6. Get Audit Logs
```bash
curl -X GET http://localhost:5000/api/audit-logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Get Trust Authority Stats
```bash
curl -X GET http://localhost:5000/api/trust-authority/AUTHORITY_ID/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Common Tasks

### How to Generate Root Keys
```
1. Login as Security Authority
2. Go to Trust Authority
3. Click "+ Create Authority"
4. System automatically generates RSA-2048 or RSA-4096 keys
5. Private key is AES-256-GCM encrypted
6. Public key stored openly
```

### How to Rotate Keys
```
1. Go to "Keys" section
2. Find key to rotate
3. Click "Rotate"
4. System generates new key pair
5. Old key marked as "rotated"
6. Audit log records the action
```

### How to Revoke Certificate
```
1. Go to "Certificates"
2. Find certificate to revoke
3. Click "Revoke"
4. Enter revocation reason
5. Certificate marked as "revoked"
6. Signature recorded in audit log
```

### How to Export Audit Logs
```
1. Go to "Audit Logs"
2. Click "Export" (CSV format)
3. Select date range if needed
4. File downloads automatically
5. Contains all audit trail data
```

---

## Troubleshooting

### MongoDB Connection Error
```
Solution: Ensure MongoDB is running
Windows: mongod.exe
macOS: brew services start mongodb-community
Linux: sudo systemctl start mongod
```

### Port Already in Use
```
# Change port in .env
PORT=5001

# Or kill process using port
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows
```

### JWT Token Invalid
```
Solution: Logout and login again
- Clear browser cache/localStorage
- Ensure FRONTEND_URL matches in backend
- Check token expiry (24 hours)
```

### MFA Not Working
```
Solution: Check authenticator app
- Ensure device time is synced
- Regenerate backup codes if needed
- Use backup codes if app unavailable
```

---

## Environment Variables

### Backend (.env)
```
# Database
MONGODB_URI=mongodb://localhost:27017/stcimp

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security Keys
JWT_SECRET=your_secret_key_here
ENCRYPTION_KEY=32_char_hex_string
MASTER_ENCRYPTION_KEY=32_char_hex_string

# Optional
LOG_LEVEL=debug
RATE_LIMIT=100
AUDIT_LOG_RETENTION_DAYS=90
```

### Frontend (.env)
```
# API
VITE_API_URL=http://localhost:5000

# Optional
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

---

## Performance Optimization

### Enable Caching
```bash
# Install Redis
npm install redis

# Configure in server.js
// Uncomment Redis integration
```

### Database Indexing
```javascript
// Already implemented in models
// Indexes on:
// - userId, createdAt
// - trustAuthorityId, status
// - certificateId
// - fileHash
```

### Pagination
```
// All list endpoints support pagination
GET /api/endpoint?page=1&limit=20
```

---

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

### MFA Setup
- Use authenticator app (Google Authenticator, Authy, Microsoft Authenticator)
- Save backup codes securely
- Backup codes are one-time use

### Key Rotation
- Rotate keys at least quarterly
- Schedule automatic rotation
- Archive old keys
- Keep rotation logs

### Audit Monitoring
- Review audit logs daily
- Look for anomalies
- Archive logs after 90 days
- Verify log signatures regularly

---

## Useful Commands

### Reset Database
```bash
# WARNING: Deletes all data
mongo
use stcimp
db.dropDatabase()
exit
```

### Generate New Encryption Keys
```bash
openssl rand -hex 32  # For 256-bit key
```

### Check Backend Health
```bash
curl http://localhost:5000/api/health
```

### Monitor Logs
```bash
# Terminal
npm run dev -- --verbose

# Production
pm2 logs st-cimp-backend
```

---

## Next Steps

1. **Explore Dashboard** - View statistics and recent activity
2. **Create Trust Authority** - Set up your PKI infrastructure
3. **Define Policies** - Configure encryption standards
4. **Request Certificates** - Start managing digital certificates
5. **Enable MFA** - Secure all user accounts
6. **Review Audit Logs** - Monitor system activity
7. **Schedule Backups** - Protect your data
8. **Deploy to Production** - Use HTTPS, HSM, firewalls

---

## Support Resources

- **Documentation**: ST_CIMP_UPGRADE_GUIDE.md
- **API Reference**: README.md
- **Troubleshooting**: Each page has inline help
- **Logs**: Check console and application logs

---

## Version Information

- **Platform**: ST-CIMP v2.0
- **Node.js**: 18+
- **MongoDB**: 5.0+
- **React**: 18+
- **Express**: 4.18+
- **Status**: Production Ready

---

**Need Help?** Check the documentation files or review the code comments for additional details.
