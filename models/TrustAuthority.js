import mongoose from 'mongoose';

const trustAuthoritySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Trust Authority name is required'],
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    administratorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Change from required to optional
    },
    rootKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RootKey',
      default: null, // Change from required to optional
    },
    publicKey: {
      type: String,
      default: '', // Change from required to optional for default TA
    },
    privateKeyEncrypted: {
      type: String,
      default: '',
      select: false,
    },
    encryptionAlgorithm: {
      type: String,
      default: 'aes-256-gcm',
    },
    keyLength: {
      type: Number,
      default: 2048,
      enum: [2048, 4096],
    },
    issuedCertificatesCount: {
      type: Number,
      default: 0,
    },
    revokedCertificatesCount: {
      type: Number,
      default: 0,
    },
    certificateLifetime: {
      type: Number,
      default: 365,
      description: 'Certificate validity in days',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'revoked'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Change from required to optional
    },
    trustLevel: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    policyVersion: {
      type: Number,
      default: 1,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

trustAuthoritySchema.index({ administratorId: 1, status: 1 });
trustAuthoritySchema.index({ isDefault: 1 });

export default mongoose.model('TrustAuthority', trustAuthoritySchema);
