# ST-CIMP: Secure Trust & Cryptographic Infrastructure Management Platform

## Upgrade Overview

This document outlines the comprehensive upgrade from SCKLMS to ST-CIMP, implementing advanced cryptographic trust management with three specialized user roles and seven critical phases.

## New Architecture

### Three User Roles (Updated)

1. **Security Authority (Root Admin)**
   - Creates and manages Trust Authorities
   - Generates and protects Root Keys (RSA-2048/4096)
   - Signs certificates with private keys
   - Defines cryptographic policies
   - Full access to audit logs
   - Can revoke certificates and keys

2. **System Client (Developer/Service)**
   - Requests certificates and keys
   - Uses keys for signing and verification
   - Limited audit log access
   - Cannot access private keys directly
   - Cannot create new trust authorities

3. **Auditor (Compliance Officer)**
   - Read-only access to all operations
   - Verifies audit log integrity
   - Cannot access private keys
   - Cannot modify any resources
   - Full verification capabilities

## Seven Implementation Phases

### Phase 1: User & Trust Authority Setup ✅
**Completed Features:**
- Enhanced user registration with MFA (TOTP + backup codes)
- Multi-factor authentication (Username + Password + OTP)
- NIST-style password hashing (bcryptjs, 10 salt rounds)
- Role-based access control matrix
- User model includes new trust authority relationships

**Models Updated:**
- `User.js` - Added trustAuthorityId, publicKey, cryptoPolicies, approvedRootKey
- New `TrustAuthority.js` - Full trust authority lifecycle management

### Phase 2: Root Trust & Key Infrastructure ✅
**Completed Features:**
- Root key generation (RSA-2048/4096)
- Private key encryption with AES-256-GCM
- RSA public key storage
- Key rotation scheduling (quarterly, annually, manual)
- Trust level scoring (0-100%)
- Key lifecycle tracking

**Models Created:**
- `RootKey.js` - Complete root key management with encryption

**API Routes:**
- `POST /api/trust-authority/create` - Create trust authority with root key
- `GET /api/trust-authority` - List all trust authorities
- `GET /api/trust-authority/:id` - Get specific trust authority
- `PATCH /api/trust-authority/:id/status` - Update status (active/suspended/revoked)
- `GET /api/trust-authority/:id/stats` - Trust authority statistics

### Phase 3: Certificate Lifecycle (CORE) ✅
**Completed Features:**
- Certificate request submission by System Clients
- Certificate issuance with digital signatures
- Base64 encoding of certificates
- QR code generation support
- Certificate verification with public keys
- Expiry date checking
- Revocation list management
- Chain-of-custody tracking
- Certificate encoding in multiple formats

**Model Enhancements:**
- `Certificate.js` - Major upgrade with:
  - certificateId (unique identifier)
  - Digital signature storage
  - Encryption status tracking
  - Revocation details with signatures
  - Integrity check records
  - Chain of custody audit trail
  - Base64 and QR code support

**API Endpoints:**
- Existing certificate routes enhanced with ST-CIMP features

### Phase 4: Key Vault & Secure Storage ✅
**Completed Features:**
- AES-256-GCM encryption for all private keys
- RSA key wrapping for symmetric key protection
- Controlled key usage with permission matrix
- Temporary key decryption on-demand
- Key access logging
- Compliance status tracking
- Key usage statistics (sign, verify, encrypt, decrypt)

**Model Enhancements:**
- `CryptoKey.js` - Complete upgrade with:
  - keyId (unique identifier)
  - trustAuthorityId reference
  - privateKeyEncrypted (select: false for security)
  - RSA wrapping support
  - Key derivation with PBKDF2
  - Salt value storage
  - Iteration count (100,000 by default)
  - Trust score and compliance status

### Phase 5: Policy Engine (UNIQUE) ✅
**Completed Features:**
- Cryptographic policy definition
- Key length requirements (1024-4096 bits)
- Certificate validity period enforcement
- Encryption algorithm selection (AES-256-GCM, AES-256-CBC)
- Hash algorithm selection (SHA-256, SHA-384, SHA-512)
- Signing algorithm selection (RSA-2048, RSA-4096, ECDSA)
- Role-based access control within policies
- Key rotation requirements (monthly, quarterly, annually)
- Compliance requirement enforcement
- Policy versioning

**Models Created:**
- `CryptoPolicy.js` - Comprehensive policy management

**API Routes:**
- `POST /api/crypto-policies/create` - Create policy
- `GET /api/crypto-policies` - List all policies
- `GET /api/crypto-policies/:id` - Get specific policy
- `PATCH /api/crypto-policies/:id` - Update policy
- `PATCH /api/crypto-policies/:id/deactivate` - Deactivate policy
- `GET /api/crypto-policies/:id/details` - Get policy details

### Phase 6: File Integrity & Tamper Detection ✅
**Completed Features:**
- File hash verification (SHA-256)
- Digital signature verification on files
- Tampering detection with hash comparison
- MITM (Man-in-the-Middle) attack detection
- Integrity compromise reporting
- File verification requests
- Verification result storage
- Comprehensive verification logging

**Model Created:**
- `VerificationRequest.js` - Complete verification tracking

**Encryption Utilities Added:**
- `verifyFileIntegrity()` - Check file integrity
- `detectMITMAttack()` - Detect MITM attacks
- `detectReplayAttack()` - Replay attack detection
- `generateNonce()` - Nonce generation for security

**API Routes:**
- `POST /api/verification/verify-integrity` - Verify file
- `POST /api/verification/check-replay` - Check replay attacks
- `POST /api/verification/request` - Create verification request
- `GET /api/verification/:verificationId` - Get verification status
- `GET /api/verification/user/all` - Get user's verifications
- `POST /api/verification/generate-nonce` - Generate secure nonce

### Phase 7: Audit & Chain-of-Custody ✅
**Completed Features:**
- Immutable audit logging with hash chaining
- Digital signature on audit logs
- Previous log hash linking (blockchain-style)
- Integrity verification tracking
- Chain of custody break detection
- Forensic data collection
- Log severity levels (low, medium, high, critical)
- Risk indicator tracking
- Mitigation action recording
- Non-repudiation guarantees

**Model Enhancements:**
- `AuditLog.js` - Major security upgrades with:
  - logId (unique identifier)
  - logHash (immutable hash)
  - previousLogHash (chain linking)
  - digitalSignature (non-repudiation)
  - hashAlgorithm (configurable)
  - integrityVerified tracking
  - chainOfCustodyBreak detection
  - forensicData (session, fingerprint, request IDs)
  - New action types for ST-CIMP features
  - trustAuthorityId tracking

## Security Features Implemented

### Encryption Matrix
- **At Rest**: AES-256-GCM for all private data
- **Key Exchange**: RSA key wrapping (2048/4096 bits)
- **Hashing**: SHA-256 (configurable to SHA-384/512)
- **Signing**: RSA with SHA-256 (upgradeable to 4096-bit or ECDSA)
- **Password Storage**: bcryptjs with 10 salt rounds

### Authentication & MFA
- **Single Factor**: Username + Password
- **Multi-Factor**: TOTP-based OTP + Backup codes
- **Session Management**: JWT tokens (24-hour lifetime)
- **Account Lockout**: 5 failed attempts = 15 minute lockout

### Tamper Detection
- MITM attack detection with data comparison
- Replay attack prevention with nonce system
- File integrity verification with hash comparison
- Chain of custody break detection
- Digital signature verification on all sensitive operations

### Attack Prevention
- **MITM Prevention**: Data mismatch detection, secure key exchange
- **Replay Prevention**: Nonce system with expiry (5 min)
- **Key Theft Prevention**: Encrypted key storage with RSA wrapping
- **Tampering Detection**: Cryptographic hash verification
- **Log Tampering**: Hash chain + digital signatures

## Enhanced Encryption Utilities

New functions added to `backend/utils/encryption.js`:

```javascript
// Advanced Features
generateRSAKeyPairWithEncryption(keyLength, masterKey)
decryptPrivateKey(encryptedPrivateKey, masterKey)
encryptKeyWithRSAWrapping(symmetricKey, rsaPublicKey)
decryptKeyWithRSAUnwrapping(wrappedKey, rsaPrivateKey)
generateDerivedKey(password, salt, iterations, keyLength)
generateSalt(length)
base64EncodeData(data)
base64DecodeData(encoded)
verifyFileIntegrity(fileData, expectedHash)
detectMITMAttack(requestData, expectedData)
detectReplayAttack(nonce, previousNonces)
generateNonce()
createDigitalSignatureWithTimestamp(data, privateKey)
verifyDigitalSignatureWithTimestamp(data, timestamp, signature, publicKey, maxAge)
```

## Frontend Pages Added

### 1. Trust Authority Management (`/trust-authority`)
- Create new trust authorities (Security Authority only)
- View all trust authorities
- Monitor trust levels
- Check certificate issuance statistics
- Beautiful card-based UI with animations

### 2. Cryptographic Policies (`/crypto-policies`)
- Create and manage crypto policies
- Configure key length requirements
- Set certificate validity periods
- Choose encryption/hash algorithms
- Define access control rules
- Version tracking with policy updates

### 3. File Verification (`/file-verification`)
- Upload files for integrity verification
- Check digital signatures
- Detect tampering
- Assess MITM attack risk
- View verification results
- Beautiful result cards with risk indicators

### 4. Updated Layout & Navigation
- New sidebar menu items for ST-CIMP features
- Role-based menu visibility
- Enhanced UI with modern animations
- Gradient backgrounds and glass morphism effects

## Database Models

### Complete Model Hierarchy

```
User (enhanced)
├── trustAuthorityId → TrustAuthority
├── cryptoPolicies → [CryptoPolicy]
├── approvedRootKey → RootKey
└── publicKey (user's signing key)

TrustAuthority
├── administratorId → User
├── rootKeyId → RootKey
├── createdBy → User
└── policies applied via CryptoPolicy

RootKey
├── trustAuthorityId → TrustAuthority
├── createdBy → User
└── encrypted private key

CryptoPolicy
├── trustAuthorityId → TrustAuthority
├── createdBy → User
└── defines encryption standards

Certificate (enhanced)
├── trustAuthorityId → TrustAuthority
├── signedBy → User
├── requestedBy → User
├── revocation tracking
├── digital signature
└── chain of custody

CryptoKey (enhanced)
├── trustAuthorityId → TrustAuthority
├── createdBy → User
├── encrypted private key
├── RSA wrapping support
└── compliance tracking

VerificationRequest
├── userId → User
├── certificateId → Certificate
├── MITM detection
├── Replay attack tracking
└── Tamper detection

AuditLog (enhanced)
├── userId → User
├── trustAuthorityId → TrustAuthority
├── logId (unique)
├── digital signature
├── hash chain (previous log hash)
└── forensic data
```

## API Endpoints Summary

### Trust Authority Routes (`/api/trust-authority`)
- POST `/create` - Create new trust authority
- GET `/` - List all authorities
- GET `/:id` - Get specific authority
- PATCH `/:id/status` - Update status
- GET `/:id/stats` - Get statistics

### Crypto Policies Routes (`/api/crypto-policies`)
- POST `/create` - Create policy
- GET `/` - List policies
- GET `/:id` - Get specific policy
- PATCH `/:id` - Update policy
- PATCH `/:id/deactivate` - Deactivate policy
- GET `/:id/details` - Get policy details

### Verification Routes (`/api/verification`)
- POST `/verify-integrity` - Verify file integrity
- POST `/check-replay` - Check for replay attacks
- POST `/request` - Create verification request
- GET `/:verificationId` - Get verification status
- GET `/user/all` - Get user's verifications
- POST `/generate-nonce` - Generate secure nonce

### Enhanced Existing Routes
- `/api/auth/*` - Enhanced with new roles
- `/api/certificates/*` - Enhanced with ST-CIMP features
- `/api/keys/*` - Enhanced with new encryption methods
- `/api/users/*` - Updated for new role structure
- `/api/audit-logs/*` - Enhanced with immutable logging

## Installation & Setup

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
npm run dev
```

### Default Admin Account
```
Email: admin@stcimp.com
Password: Admin@123456
Role: security_authority
MFA: Enabled (use authenticator app)
```

## Testing the System

### Phase 1: Create Trust Authority
1. Login as Security Authority
2. Navigate to Trust Authority
3. Click "Create Authority"
4. Fill in details and select key length
5. Verify Root Key generation

### Phase 2: Create Crypto Policy
1. Go to Crypto Policies
2. Create a new policy
3. Set encryption/hash requirements
4. Define access control rules

### Phase 3: Request & Issue Certificate
1. As System Client, request a certificate
2. As Security Authority, approve and issue
3. Verify certificate is signed
4. Check chain of custody

### Phase 4: Verify File Integrity
1. Go to File Verification
2. Upload a file
3. Provide certificate ID
4. Check verification results
5. Look for tampering indicators

### Phase 5: Review Audit Logs
1. As Auditor, view audit logs
2. Verify log signatures
3. Check integrity status
4. Look for anomalies

## Security Best Practices

1. **Key Management**
   - Rotate keys quarterly
   - Keep master encryption key secure
   - Use HSM for production key storage

2. **Password Security**
   - Enforce strong password requirements
   - Use bcryptjs (10+ salt rounds)
   - Require MFA for all users

3. **Audit & Monitoring**
   - Review logs regularly
   - Alert on suspicious activities
   - Verify audit log integrity daily

4. **Access Control**
   - Least privilege principle
   - Regular permission reviews
   - Separate admin accounts

## Performance Optimization

- Database indexes on frequently queried fields
- Pagination for large result sets
- Caching layer for policies
- Nonce cleanup mechanism
- Log TTL (90 days default)

## Compliance Features

- NIST SP 800-175B compliant
- Non-repudiation through digital signatures
- Immutable audit logs with hash chaining
- Chain of custody tracking
- Comprehensive forensic data collection

## Support & Documentation

For detailed API documentation, see:
- `README.md` - Full system overview
- `PROJECT_STRUCTURE.md` - Code organization
- `QUICK_REFERENCE.md` - Common tasks
- API inline documentation in route files

---

**Version**: 2.0 (ST-CIMP)
**Release Date**: 2024
**Status**: Production Ready
