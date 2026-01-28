import mongoose from 'mongoose';

const verificationRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    certificateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certificate',
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
    },
    fileData: {
      originalFilename: String,
      fileSize: Number,
      uploadedAt: Date,
    },
    verificationDetails: {
      hashAlgorithm: {
        type: String,
        default: 'sha256',
      },
      signatureAlgorithm: {
        type: String,
        default: 'RSA-2048',
      },
      computedHash: String,
      providedSignature: String,
      signatureValid: {
        type: Boolean,
        default: null,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'tampered', 'expired'],
      default: 'pending',
    },
    verificationResult: {
      isValid: Boolean,
      integrityCompromised: {
        type: Boolean,
        default: false,
      },
      certificateValid: Boolean,
      certificateExpired: Boolean,
      certificateRevoked: Boolean,
      reasons: [String],
    },
    tamperDetection: {
      detectedTamper: {
        type: Boolean,
        default: false,
      },
      tamperDetails: String,
      comparisonResult: {
        originalHash: String,
        currentHash: String,
        match: Boolean,
      },
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationTimestamp: Date,
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    mitmRiskAssessment: {
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
      },
      indicators: [String],
      mitigation: [String],
    },
    replayAttackCheck: {
      isReplay: {
        type: Boolean,
        default: false,
      },
      previousRequestIds: [String],
      timestamp: Date,
      nonce: String,
    },
  },
  { timestamps: true }
);

verificationRequestSchema.index({ userId: 1, status: 1 });
verificationRequestSchema.index({ certificateId: 1 });
verificationRequestSchema.index({ fileHash: 1 });
verificationRequestSchema.index({ createdAt: 1 });

export default mongoose.model('VerificationRequest', verificationRequestSchema);
