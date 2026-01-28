import mongoose from 'mongoose';

const cryptoKeySchema = new mongoose.Schema(
  {
    keyId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Key name is required'],
    },
    description: String,
    trustAuthorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustAuthority',
      required: true,
    },
    keyType: {
      type: String,
      enum: ['RSA', 'AES', 'ECDSA', 'EdDSA'],
      required: true,
    },
    keyLength: {
      type: Number,
      enum: [128, 192, 256, 384, 521, 1024, 2048, 4096],
      required: true,
    },
    publicKey: String,
    privateKeyEncrypted: {
      type: String,
      select: false,
    },
    keyHash: {
      type: String,
      unique: true,
    },
    hashAlgorithm: {
      type: String,
      default: 'sha256',
    },
    status: {
      type: String,
      enum: ['active', 'rotated', 'revoked', 'archived', 'compromised'],
      default: 'active',
    },
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    lastRotated: Date,
    nextRotationDue: Date,
    rotationPolicy: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually', 'manual'],
      default: 'quarterly',
    },
    keyUsage: {
      signing: {
        type: Number,
        default: 0,
      },
      verification: {
        type: Number,
        default: 0,
      },
      encryption: {
        type: Number,
        default: 0,
      },
      decryption: {
        type: Number,
        default: 0,
      },
    },
    accessControl: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        permissions: [
          {
            type: String,
            enum: ['view', 'use', 'rotate', 'revoke', 'delete'],
          },
        ],
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
    rsaWrappingEnabled: {
      type: Boolean,
      default: true,
    },
    wrappingKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RootKey',
    },
    keyDerivationFunction: {
      type: String,
      default: 'pbkdf2',
    },
    saltValue: {
      type: String,
      select: false,
    },
    iterationCount: {
      type: Number,
      default: 100000,
    },
    tags: [String],
    metadata: mongoose.Schema.Types.Mixed,
    complianceStatus: {
      type: String,
      enum: ['compliant', 'non-compliant', 'unknown'],
      default: 'unknown',
    },
  },
  { timestamps: true }
);

cryptoKeySchema.index({ createdBy: 1, status: 1 });
cryptoKeySchema.index({ keyType: 1, status: 1 });
cryptoKeySchema.index({ tags: 1 });

export default mongoose.model('CryptoKey', cryptoKeySchema);
