import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      required: true,
      unique: true,
    },
    action: {
      type: String,
      enum: [
        'LOGIN',
        'LOGOUT',
        'CREATE_CERT',
        'UPDATE_CERT',
        'DELETE_CERT',
        'VIEW_CERT',
        'EXPORT_CERT',
        'CREATE_KEY',
        'UPDATE_KEY',
        'DELETE_KEY',
        'ROTATE_KEY',
        'USE_KEY',
        'ENCRYPT_DATA',
        'DECRYPT_DATA',
        'SIGN_DATA',
        'VERIFY_SIGNATURE',
        'REVOKE_CERT',
        'REVOKE_KEY',
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'PERMISSION_CHANGED',
        'MFA_ENABLED',
        'MFA_DISABLED',
        'PASSWORD_CHANGED',
        'FAILED_LOGIN',
        'EXPORT_AUDIT_LOG',
        'CREATE_TRUST_AUTHORITY',
        'UPDATE_TRUST_AUTHORITY',
        'GENERATE_ROOT_KEY',
        'SIGN_CERTIFICATE',
        'ISSUE_CERTIFICATE',
        'VERIFY_INTEGRITY',
        'DETECT_TAMPER',
        'VERIFY_SIGNATURE_FILE',
        'CREATE_POLICY',
        'UPDATE_POLICY',
      ],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: String,
    userRole: String,
    trustAuthorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustAuthority',
    },
    resourceType: {
      type: String,
      enum: ['Certificate', 'CryptoKey', 'User', 'System', 'AuditLog', 'TrustAuthority', 'RootKey', 'CryptoPolicy', 'VerificationRequest'],
    },
    resourceId: mongoose.Schema.Types.ObjectId,
    resourceName: String,
    description: String,
    status: {
      type: String,
      enum: ['success', 'failure', 'pending', 'blocked', 'anomaly'],
      default: 'success',
    },
    ipAddress: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    affectedRecords: [
      {
        recordId: mongoose.Schema.Types.ObjectId,
        recordType: String,
      },
    ],
    logHash: {
      type: String,
      required: true,
      unique: true,
    },
    hashAlgorithm: {
      type: String,
      default: 'sha256',
    },
    previousLogHash: {
      type: String,
      default: null,
    },
    digitalSignature: {
      type: String,
      select: false,
    },
    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    signatureAlgorithm: {
      type: String,
      default: 'RSA-2048',
    },
    immutable: {
      type: Boolean,
      default: true,
    },
    chainOfCustodyBreak: {
      type: Boolean,
      default: false,
    },
    integrityVerified: {
      type: Boolean,
      default: true,
    },
    lastVerifiedAt: Date,
    riskIndicators: [String],
    mitigationActions: [String],
    forensicData: {
      sessionId: String,
      deviceFingerprint: String,
      requestId: String,
      correlatedLogs: [String],
    },
  },
  { timestamps: true, expireAfterSeconds: 7776000 } // 90 days TTL
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ createdAt: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
