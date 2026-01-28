import mongoose from 'mongoose';

const cryptoPolicySchema = new mongoose.Schema(
  {
    policyName: {
      type: String,
      required: [true, 'Policy name is required'],
      unique: true,
    },
    trustAuthorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustAuthority',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    policyVersion: {
      type: Number,
      default: 1,
    },
    keyLengthRequirements: {
      minimum: {
        type: Number,
        default: 2048,
        enum: [1024, 2048, 4096],
      },
      recommended: {
        type: Number,
        default: 2048,
      },
      maximum: {
        type: Number,
        default: 4096,
      },
    },
    certificateValidity: {
      minimum: {
        type: Number,
        default: 30,
        description: 'Minimum validity in days',
      },
      maximum: {
        type: Number,
        default: 365,
        description: 'Maximum validity in days',
      },
      default: {
        type: Number,
        default: 365,
      },
    },
    encryptionAlgorithm: {
      type: String,
      enum: ['aes-256-gcm', 'aes-256-cbc', 'chacha20-poly1305'],
      default: 'aes-256-gcm',
    },
    hashAlgorithm: {
      type: String,
      enum: ['sha256', 'sha384', 'sha512'],
      default: 'sha256',
    },
    signingAlgorithm: {
      type: String,
      enum: ['RSA-2048', 'RSA-4096', 'ECDSA'],
      default: 'RSA-2048',
    },
    accessControl: {
      allowedRoles: [
        {
          type: String,
          enum: ['security_authority', 'system_client', 'auditor'],
        },
      ],
      canIssue: {
        type: String,
        enum: ['security_authority', 'system_client', 'both'],
        default: 'security_authority',
      },
      canRevoke: {
        type: String,
        enum: ['security_authority', 'system_client', 'both'],
        default: 'security_authority',
      },
      canAccess: [
        {
          type: String,
          enum: ['security_authority', 'system_client', 'auditor'],
        },
      ],
    },
    keyRotation: {
      required: {
        type: Boolean,
        default: true,
      },
      rotationInterval: {
        type: Number,
        default: 90,
        description: 'Rotation interval in days',
      },
      autoRotate: {
        type: Boolean,
        default: true,
      },
    },
    complianceRequirements: {
      requireMFA: {
        type: Boolean,
        default: true,
      },
      requireAuditLog: {
        type: Boolean,
        default: true,
      },
      requireSignature: {
        type: Boolean,
        default: true,
      },
      requireEncryption: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deprecated'],
      default: 'active',
    },
    description: String,
  },
  { timestamps: true }
);

cryptoPolicySchema.index({ trustAuthorityId: 1, status: 1 });

export default mongoose.model('CryptoPolicy', cryptoPolicySchema);
