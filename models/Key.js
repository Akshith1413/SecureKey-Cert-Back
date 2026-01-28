import mongoose from 'mongoose';

const keySchema = new mongoose.Schema(
  {
    keyId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Key name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    keyType: {
      type: String,
      enum: ['symmetric', 'asymmetric', 'root', 'session', 'derived'],
      required: true,
    },
    algorithm: {
      type: String,
      enum: ['RSA', 'AES', 'ECDSA', 'EdDSA', '3DES', 'ChaCha20'],
      required: true,
    },
    keyLength: {
      type: Number,
      required: true,
    },
    publicKey: {
      type: String,
    },
    privateKeyEncrypted: {
      type: String,
    },
    symmetricKeyEncrypted: {
      type: String,
    },
    iv: {
      type: String,
    },
    authTag: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'expired', 'compromised', 'archived'],
      default: 'active',
    },
    usage: {
      type: String,
      enum: ['encryption', 'signing', 'both', 'key_wrapping', 'authentication'],
      default: 'encryption',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trustAuthorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustAuthority',
      required: true,
    },
    parentKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Key',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
    rotationSchedule: {
      type: String,
      enum: ['never', 'monthly', 'quarterly', 'yearly', 'custom'],
      default: 'yearly',
    },
    lastRotated: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    maxUsageCount: {
      type: Number,
    },
    exportable: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Map,
      of: String,
    },
    tags: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
keySchema.index({ keyId: 1 });
keySchema.index({ ownerId: 1, status: 1 });
keySchema.index({ trustAuthorityId: 1, status: 1 });
keySchema.index({ status: 1, validUntil: 1 });

// Method to check if key is expired
keySchema.methods.isExpired = function () {
  if (!this.validUntil) return false;
  return new Date() > this.validUntil;
};

// Method to check if key needs rotation
keySchema.methods.needsRotation = function () {
  if (!this.lastRotated || this.rotationSchedule === 'never') return false;
  
  const now = new Date();
  const lastRot = new Date(this.lastRotated);
  
  switch (this.rotationSchedule) {
    case 'monthly':
      return (now - lastRot) > 30 * 24 * 60 * 60 * 1000;
    case 'quarterly':
      return (now - lastRot) > 90 * 24 * 60 * 60 * 1000;
    case 'yearly':
      return (now - lastRot) > 365 * 24 * 60 * 60 * 1000;
    default:
      return false;
  }
};

const Key = mongoose.model('Key', keySchema);

export default Key;
