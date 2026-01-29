# ST-CIMP Complete API Reference & Testing Guide

## User Roles & Permissions Fixed

### 1. Security Authority (Root Admin)
**Role ID**: `security_authority`

#### Permissions:
- view_certs, create_certs, delete_certs, revoke_certs
- view_keys, create_keys, delete_keys, rotate_keys, revoke_keys
- view_audit_logs, manage_users, export_data
- encrypt_decrypt, sign_verify
- manage_trust_authority, manage_policies

#### Key Features:
- Full access to all certificates and keys
- Can sign, revoke, and manage all certificates
- Can rotate and revoke all cryptographic keys
- Full audit log access
- Can manage all users and assign roles
- Can create and enforce crypto policies
- Can create trust authorities

---

### 2. System Client (Developer)
**Role ID**: `system_client`

#### Permissions:
- view_certs, view_keys
- encrypt_decrypt, sign_verify, create_keys, create_certs
- view_audit_logs_own

#### Key Features:
- Can create and use their own certificates and keys
- Can encrypt/decrypt data
- Can digitally sign data
- Can view their own audit logs
- Limited access - cannot revoke or delete others' resources

---

### 3. Auditor
**Role ID**: `auditor`

#### Permissions:
- view_certs, view_keys
- view_audit_logs, export_data
- verify_signatures

#### Key Features:
- Read-only access to all certificates and keys
- Full audit log viewing and export
- Can verify digital signatures
- Cannot access private keys
- Cannot create or modify resources

---

## All API Endpoints - FIXED & WORKING

### Authentication Endpoints

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/change-password
POST /api/auth/mfa/setup
POST /api/auth/mfa/verify
POST /api/auth/mfa/validate
```

### Certificate Management Endpoints

```
GET /api/certificates                    (View all certs)
GET /api/certificates/:id                (View single cert)
POST /api/certificates                   (Create cert)
PUT /api/certificates/:id                (Update cert)
DELETE /api/certificates/:id             (Delete cert)
POST /api/certificates/:id/revoke        (Revoke cert - FIXED)
POST /api/certificates/:id/sign          (Sign cert - NEW)
POST /api/certificates/:id/verify-signature  (Verify signature - NEW)
```

### Cryptographic Keys Endpoints

```
GET /api/keys                            (View all keys)
GET /api/keys/:id                        (View single key)
POST /api/keys/generate                  (Generate key)
POST /api/keys/:id/rotate               (Rotate key - FIXED)
POST /api/keys/:id/revoke               (Revoke key - FIXED)
DELETE /api/keys/:id                     (Delete key)
POST /api/keys/encrypt                   (Encrypt data)
POST /api/keys/decrypt                   (Decrypt data)
```

### User Management Endpoints

```
GET /api/users                           (List all users - security_authority only)
GET /api/users/:id                       (Get user details - FIXED role)
GET /api/users/profile                   (Get current profile)
PUT /api/users/:id                       (Update user - FIXED role)
```

### Audit Log Endpoints

```
GET /api/audit-logs                      (View logs - auditor & security_authority - FIXED)
GET /api/audit-logs/:id                  (View single log - FIXED)
POST /api/audit-logs/export              (Export audit logs)
```

### Trust Authority Endpoints

```
POST /api/trust-authority                (Create trust authority - NEW)
GET /api/trust-authority                 (List authorities - NEW)
GET /api/trust-authority/:id             (Get authority details - NEW)
PUT /api/trust-authority/:id             (Update authority - NEW)
```

### Crypto Policy Endpoints

```
POST /api/crypto-policies                (Create policy - NEW)
GET /api/crypto-policies                 (List policies - NEW)
GET /api/crypto-policies/:id             (Get policy - NEW)
PUT /api/crypto-policies/:id             (Update policy - NEW)
DELETE /api/crypto-policies/:id          (Delete policy - NEW)
```

### File Verification Endpoints

```
POST /api/verification/verify-hash       (Verify file integrity - NEW)
POST /api/verification/verify-signature  (Verify signature - NEW)
POST /api/verification/detect-tampering  (Detect tampering - NEW)
```

---

## Complete Test Scenarios

### Test Scenario 1: Security Authority Full Workflow

```bash
# 1. Register as Security Authority
POST /api/auth/register
{
  "firstName": "Admin",
  "lastName": "Authority",
  "email": "admin@stcimp.com",
  "password": "SecurePass@123",
  "role": "security_authority"
}

# 2. Login
POST /api/auth/login
{
  "email": "admin@stcimp.com",
  "password": "SecurePass@123"
}

# 3. Create Certificate
POST /api/certificates
{
  "name": "Root CA Certificate",
  "description": "Organization Root CA",
  "certificateData": "-----BEGIN CERTIFICATE-----...",
  "issuer": "ST-CIMP Root CA",
  "subject": "ST-CIMP Root CA",
  "algorithm": "RSA-4096",
  "validFrom": "2024-01-01",
  "validUntil": "2034-01-01"
}

# 4. Sign the Certificate
POST /api/certificates/{certId}/sign
(No body needed)

# 5. Verify Signature
POST /api/certificates/{certId}/verify-signature
(No body needed)

# 6. Generate Cryptographic Key
POST /api/keys/generate
{
  "name": "Master Signing Key",
  "description": "Used for signing all certificates",
  "keyType": "RSA",
  "keyLength": 4096
}

# 7. Rotate Key (when needed)
POST /api/keys/{keyId}/rotate
(No body needed)

# 8. View All Users
GET /api/users

# 9. View Audit Logs
GET /api/audit-logs

# 10. Export Audit Logs
GET /api/audit-logs?startDate=2024-01-01&endDate=2024-12-31

# 11. Revoke Certificate
POST /api/certificates/{certId}/revoke
(No body needed)

# 12. Revoke Key
POST /api/keys/{keyId}/revoke
(No body needed)
```

### Test Scenario 2: System Client Workflow

```bash
# 1. Register as System Client
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Developer",
  "email": "developer@company.com",
  "password": "ClientPass@123",
  "role": "system_client"
}

# 2. Login
POST /api/auth/login
{
  "email": "developer@company.com",
  "password": "ClientPass@123"
}

# 3. Create Own Certificate
POST /api/certificates
{
  "name": "My Application Certificate",
  "certificateData": "-----BEGIN CERTIFICATE-----...",
  "issuer": "Company CA",
  "algorithm": "RSA-2048"
}

# 4. Generate Own Key
POST /api/keys/generate
{
  "name": "My Application Key",
  "keyType": "RSA",
  "keyLength": 2048
}

# 5. Encrypt Data
POST /api/keys/encrypt
{
  "keyId": "{keyId}",
  "data": "Sensitive data to encrypt"
}

# 6. View Own Certificates
GET /api/certificates

# 7. View Own Keys
GET /api/keys

# 8. View Own Audit Logs
GET /api/audit-logs
```

### Test Scenario 3: Auditor Workflow

```bash
# 1. Register as Auditor
POST /api/auth/register
{
  "firstName": "Audit",
  "lastName": "Person",
  "email": "auditor@company.com",
  "password": "AuditPass@123",
  "role": "auditor"
}

# 2. Login
POST /api/auth/login
{
  "email": "auditor@company.com",
  "password": "AuditPass@123"
}

# 3. View All Certificates (Read-Only)
GET /api/certificates

# 4. View All Keys (Read-Only)
GET /api/keys

# 5. View All Audit Logs
GET /api/audit-logs

# 6. Filter Audit Logs by Action
GET /api/audit-logs?action=CREATE_CERT&severity=high

# 7. Filter by Date Range
GET /api/audit-logs?startDate=2024-01-01&endDate=2024-12-31

# 8. Export Audit Logs (CSV)
GET /api/audit-logs/export

# 9. Verify Certificate Signature
POST /api/certificates/{certId}/verify-signature

# 10. Check File Integrity
POST /api/verification/verify-hash
{
  "file": "base64-encoded-file",
  "expectedHash": "sha256-hash-value"
}
```

---

## All UI Features Implemented & Working

### Certificates Page
- View all certificates (animated table)
- Create new certificate (modal form)
- Search certificates by name/issuer
- Filter by status (Valid, Expired, Revoked)
- View certificate details
- Sign certificate (Lock icon button)
- Download certificate (Download icon button)
- Revoke certificate (Confirm dialog)
- Delete certificate (Confirm dialog)
- Responsive design with smooth animations

### Keys Page
- View all cryptographic keys
- Generate new keys (RSA, AES, ECDSA)
- Select key type and length
- Search and filter keys
- View key details
- Download public key (Download icon button)
- Rotate key (when active)
- Revoke key
- Delete key
- Real-time status indicators

### Trust Authority Page
- Create new trust authority
- Manage trust authorities
- Assign certificates to authorities
- View authority details

### Crypto Policies Page
- Define encryption standards
- Set rotation policies
- Configure compliance rules
- Manage policy enforcement

### File Verification Page
- Upload and verify file integrity
- Check for tampering
- Verify digital signatures
- Generate and download integrity reports

### Dashboard
- Real-time statistics
- Recent activities
- System health indicators
- User role indicators
- Quick access buttons

### Audit Logs Page
- View complete audit trail
- Filter by action, severity, date
- Search audit logs
- Export to CSV
- View log details

---

## Security Features Implemented

1. **Authentication**
   - JWT tokens (24-hour expiry)
   - MFA with TOTP + backup codes
   - Password hashing with bcryptjs (10 rounds)
   - Account lockout (5 attempts = 15 min lockout)

2. **Encryption**
   - AES-256-GCM for data at rest
   - RSA-2048/4096 for key exchange
   - PBKDF2 key derivation

3. **Authorization**
   - Role-based access control (3 roles)
   - Permission-based checks
   - Resource ownership validation

4. **Audit & Compliance**
   - Complete audit logging
   - Digital signatures on certificates
   - Hash chaining for immutability
   - 90-day audit log retention

5. **Attack Prevention**
   - MITM detection
   - Replay attack prevention
   - Tamper detection
   - Input validation
   - SQL injection prevention (Mongoose ODM)

---

## Frontend Components Enhanced

1. **Animations**
   - Page transitions with Framer Motion
   - Button hover/tap effects
   - Table row animations
   - Modal animations
   - Smooth color transitions

2. **UI/UX**
   - Glass-morphism effects
   - Gradient backgrounds
   - Loading spinners
   - Toast notifications
   - Responsive design
   - Dark theme with blue/cyan accents

3. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - Semantic HTML

---

## Summary of Fixes Made

### Backend Fixes
1. Fixed all role references: `security_admin` → `security_authority`
2. Fixed all role references: `developer` → `system_client`
3. Updated permission assignments for all three roles
4. Fixed authorization checks in all routes
5. Added sign/verify certificate endpoints
6. Added missing trust authority endpoints
7. Fixed keys.js role checks

### Frontend Enhancements
1. Added Download button for certificates and keys
2. Added Sign button for certificates
3. Added motion animations to all action buttons
4. Enhanced table layouts with better spacing
5. Added download functionality
6. Improved error handling and toast notifications
7. Fixed all API calls to use correct endpoints

### All Functionalities Now Working
- Certificate creation, viewing, updating, signing, revoking, deleting
- Key generation, viewing, rotation, revocation, deletion
- User management with role-based access
- Audit logging with filtering and export
- Digital signatures and verification
- File integrity checking
- All three user roles with full feature access
