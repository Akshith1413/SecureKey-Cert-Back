import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['security_authority', 'system_client', 'auditor'],
      default: 'system_client',
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaType: {
      type: String,
      enum: ['totp', 'email'],
      default: 'totp',
    },
    emailOtp: {
      code: String,
      expiresAt: Date,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaBackupCodes: {
      type: [String],
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    department: {
      type: String,
      default: 'General',
    },
    permissions: [
      {
        type: String,
        enum: [
          'view_certs',
          'create_certs',
          'delete_certs',
          'revoke_certs',
          'view_keys',
          'create_keys',
          'delete_keys',
          'revoke_keys',
          'rotate_keys',
          'view_audit_logs',
          'manage_users',
          'export_data',
          'encrypt_decrypt',
          'sign_verify',
          'manage_trust_authority',
          'manage_policies',
          'verify_signatures',
        ],
      },
    ],
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: Date,
    trustAuthorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustAuthority',
      default: null,
    },
    publicKey: {
      type: String,
      default: null,
    },
    cryptoPolicies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CryptoPolicy',
      },
    ],
    approvedRootKey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RootKey',
      default: null,
    },
    verificationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
