import mongoose from 'mongoose';

const rootKeySchema = new mongoose.Schema(
  {
    keyId: {
      type: String,
      required: true,
      unique: true,
    },
    trustAuthorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustAuthority',
      required: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    privateKeyEncrypted: {
      type: String,
      required: true,
      select: false,
    },
    keyLength: {
      type: Number,
      default: 2048,
      enum: [2048, 4096],
    },
    algorithm: {
      type: String,
      default: 'RSA-2048',
    },
    encryptionMethod: {
      type: String,
      default: 'aes-256-gcm',
    },
    encryptionKeyHash: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'rotated', 'revoked', 'compromised'],
      default: 'active',
    },
    usage: {
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
    },
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    rotationSchedule: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually', 'manual'],
      default: 'quarterly',
    },
    lastRotationDate: Date,
    nextRotationDate: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

rootKeySchema.index({ trustAuthorityId: 1, status: 1 });
rootKeySchema.index({ expiresAt: 1 });

export default mongoose.model('RootKey', rootKeySchema);
