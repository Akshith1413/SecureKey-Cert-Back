import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Certificate name is required'],
    },
    description: String,
    trustAuthorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustAuthority',
      required: true,
    },
    certificateData: {
      type: String,
      required: true,
    },
    certificateDataEncrypted: {
      type: String,
      select: false,
    },
    certificateHash: {
      type: String,
      unique: true,
    },
    base64Encoded: String,
    qrCode: String,
    issuer: String,
    subject: String,
    serialNumber: String,
    validFrom: Date,
    validUntil: Date,
    status: {
      type: String,
      enum: ['valid', 'expired', 'revoked', 'pending', 'suspended'],
      default: 'pending',
    },
    algorithm: {
      type: String,
      enum: ['RSA-2048', 'RSA-4096', 'EC-256', 'EC-384'],
      default: 'RSA-2048',
    },
    signatureAlgorithm: {
      type: String,
      default: 'sha256WithRSAEncryption',
    },
    hashAlgorithm: {
      type: String,
      default: 'sha256',
    },
    digitalSignature: {
      type: String,
    },
    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    accessControl: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        role: {
          type: String,
          enum: ['view', 'edit', 'admin'],
        },
      },
    ],
    isEncrypted: {
      type: Boolean,
      default: true,
    },
    encryptionMethod: {
      type: String,
      default: 'aes-256-gcm',
    },
    encryptionKey: {
      type: String,
      select: false,
    },
    revocation: {
      isRevoked: {
        type: Boolean,
        default: false,
      },
      revokedAt: Date,
      revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      revocationReason: String,
      revocationSignature: String,
    },
    integrityCheck: {
      lastVerified: Date,
      verified: Boolean,
      integrityStatus: {
        type: String,
        enum: ['valid', 'tampered', 'unknown'],
        default: 'unknown',
      },
    },
    chainOfCustody: [
      {
        action: String,
        performedBy: mongoose.Schema.Types.ObjectId,
        timestamp: Date,
        details: String,
      },
    ],
    tags: [String],
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

certificateSchema.index({ createdBy: 1, createdAt: -1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ tags: 1 });

export default mongoose.model('Certificate', certificateSchema);
