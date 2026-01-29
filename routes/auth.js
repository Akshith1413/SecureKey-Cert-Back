import express from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';
import { protect } from '../middleware/auth.js';
import TrustAuthority from '../models/TrustAuthority.js';
import nodemailer from 'nodemailer';
import axios from 'axios';

// Configure Nodemailer (fallback for local development)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const router = express.Router();

// Helper function to send email via EmailJS (Cloud) or Nodemailer (Local)
const sendEmail = async (to, subject, html) => {
  console.log(`[EMAIL DEBUG] Starting sendEmail to: ${to}`);

  // 1. Try EmailJS (Best for Render Free Tier)
  if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY) {
    console.log(`[EMAIL DEBUG] EmailJS credentials found. Using EmailJS provider.`);
    try {
      console.log(`[EMAILJS DEBUG] Attempting to send via EmailJS API...`);
      console.log(`[EMAILJS DEBUG] Service: ${process.env.EMAILJS_SERVICE_ID}, Template: ${process.env.EMAILJS_TEMPLATE_ID}`);
      // Extract OTP from HTML (regex) or pass generic code if not found
      const otpCode = html.match(/>\s*([0-9]{6})\s*</)?.[1] || "CODE";

      const emailJsPayload = {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: to,
          to_name: to.split('@')[0], // Use part of email as name since we don't pass name to this helper
          otp: otpCode,
          app_name: "SCKLMS",
          expiry_minutes: "10",
          // Keep these just in case other templates use them:
          subject: subject,
          message: html,
        }
      };

      const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', emailJsPayload);
      console.log(`[EMAILJS SUCCESS] Status: ${response.status} ${response.data}`);
      return { success: true, provider: 'emailjs' };

    } catch (error) {
      console.error('[EMAILJS ERROR]', error.response?.data || error.message);
      console.log('[EMAIL DEBUG] Falling back to SMTP...');
    }
  } else {
    console.log(`[EMAIL DEBUG] No EmailJS config found. Falling back to SMTP...`);
  }

  // 2. Fallback to Nodemailer (SMTP)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      console.log(`[SMTP DEBUG] Attempting SMTP send to ${to} via ${process.env.EMAIL_HOST}`);
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"SCKLMS Security" <noreply@scklms.com>',
        to: to,
        subject: subject,
        html: html,
      });
      console.log(`[SMTP SUCCESS] Sent via SMTP to ${to}`);
      return { success: true, provider: 'smtp' };
    } catch (error) {
      console.error('[SMTP ERROR] Connection failed:', error.message);
      return { success: false, error: 'smtp_failed', details: error.message };
    }
  }

  // 3. Fallback: Simulating send (if configured to skip or if all else fails)
  if (process.env.SKIP_SMTP === 'true') {
    console.log(`[EMAIL] SKIP_SMTP=true. Simulating send to ${to}`);
    return { success: true, provider: 'skipped', skipped: true };
  }

  console.error('[EMAIL ERROR] No valid email provider configured.');
  return { success: false, error: 'not_configured' };
};





// @route   POST /api/auth/mfa/email/send
// @desc    Send OTP code via email
// @access  Private
router.post('/mfa/email/send', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user record
    user.emailOtp = {
      code: otp,
      expiresAt: expiresAt,
    };
    await user.save();

    // Build email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00bcd4;">Security Verification</h2>
        <p>Your verification code for SCKLMS is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">If you didn't request this code, please contact your administrator immediately.</p>
      </div>
    `;

    // Send email using Nodemailer with hybrid fallback
    const emailResult = await sendEmail(user.email, 'Your SCKLMS Verification Code', emailHtml);

    if (emailResult.success) {
      // If skipped (cloud), show specific message
      if (emailResult.skipped) {
        res.status(200).json({
          success: true,
          message: 'Verification status: Cloud Mode (Email Skipped). Use the code below.',
          devOtp: otp,
          provider: 'skipped'
        });
      } else {
        // Normal SMTP success
        res.status(200).json({
          success: true,
          message: 'OTP sent to your email',
          provider: emailResult.provider,
        });
      }
    } else {
      // Email failed - return OTP for manual entry (fallback)
      console.log(`[EMAIL FALLBACK] Email failed, returning OTP for ${user.email}: ${otp}`);
      res.status(200).json({
        success: true,
        message: 'Email service unavailable. Use the code shown below.',
        devOtp: otp,
        emailError: emailResult.error,
      });
    }
  } catch (error) {
    console.error('[EMAIL OTP SEND ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
});



// @route   POST /api/auth/mfa/email/verify
// @desc    Verify email OTP and enable MFA
// @access  Private
router.post('/mfa/email/verify', protect, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    // console.log('Verifying OTP for user:', user._id);
    // console.log('Stored OTP:', user.emailOtp);
    // console.log('Received Token:', token);

    if (!user.emailOtp || !user.emailOtp.code) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.',
      });
    }

    if (user.emailOtp.code !== token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    if (new Date(user.emailOtp.expiresAt) < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.',
      });
    }

    // Enable MFA
    user.mfaEnabled = true;
    user.mfaType = 'email';
    user.emailOtp = undefined; // Clear OTP
    await user.save();

    await logAudit(req, res, {
      action: 'MFA_ENABLED',
      resourceType: 'User',
      resourceId: user._id,
      description: `Email MFA enabled for user`,
      severity: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'Email MFA enabled successfully',
    });
  } catch (error) {
    console.error('[EMAIL MFA VERIFY ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
});

// @route   POST /api/auth/mfa/email/login-send
// @desc    Send OTP for login verification (called during login when email MFA is enabled)
// @access  Public (but requires pending login token)
router.post('/mfa/email/login-send', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailOtp = {
      code: otp,
      expiresAt: expiresAt,
    };
    await user.save();

    // Build email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00bcd4;">Login Verification</h2>
        <p>Your login verification code for SCKLMS is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">If you didn't request this code, please change your password immediately.</p>
      </div>
    `;

    // Send email using Nodemailer with hybrid fallback
    const emailResult = await sendEmail(user.email, 'Your SCKLMS Login Verification Code', emailHtml);

    if (emailResult.success) {
      if (emailResult.skipped) {
        res.status(200).json({
          success: true,
          message: 'Verification (Cloud Mode): Use the code displayed below.',
          devOtp: otp,
          provider: 'skipped'
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'OTP sent to your email',
          provider: emailResult.provider,
        });
      }
    } else {
      // Email failed - return OTP for manual entry (fallback)
      console.log(`[EMAIL FALLBACK] Login email failed, returning OTP for ${user.email}: ${otp}`);
      res.status(200).json({
        success: true,
        message: 'Email service unavailable. Use the code shown below.',
        devOtp: otp,
        emailError: emailResult.error,
      });
    }
  } catch (error) {
    console.error('[EMAIL OTP LOGIN SEND ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
});
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public

// Update the register route to assign a trust authority
// Update the register route to assign a trust authority
router.post('/register', async (req, res) => {
  try {
    let { firstName, lastName, email, password, role, trustAuthorityId } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Default role if not provided
    if (!role) {
      role = 'system_client';
    }

    // Set default permissions based on role
    let permissions = [];
    if (role === 'security_authority') {
      permissions = [
        'view_certs',
        'create_certs',
        'delete_certs',
        'revoke_certs',
        'view_keys',
        'create_keys',
        'delete_keys',
        'rotate_keys',
        'revoke_keys',
        'view_audit_logs',
        'manage_users',
        'export_data',
        'encrypt_decrypt',
        'sign_verify',
        'manage_trust_authority',
        'manage_policies',
      ];
    } else if (role === 'system_client') {
      permissions = [
        'view_certs',
        'view_keys',
        'encrypt_decrypt',
        'sign_verify',
        'create_keys',
        'create_certs',
        'view_audit_logs',
      ];
    } else if (role === 'auditor') {
      permissions = [
        'view_certs',
        'view_keys',
        'view_audit_logs',
        'export_data',
        'verify_signatures',
      ];
    }

    // Get or create a default trust authority for the user
    let userTrustAuthorityId = trustAuthorityId;

    // Auditors usually audit specific TAs, but don't necessarily belong to one in the same way.
    // However, for simplicity, we assign them to default if not specified, 
    // or we can leave it null if the system supports it. 
    // Checking previous logic, it tried to always assign one.
    // We will keep attempting to assign one, but wrapping in try-catch to not fail registration if TA fails.

    if (!userTrustAuthorityId) {
      try {
        // Find or create a default trust authority
        const defaultTrustAuthority = await TrustAuthority.findOne({ name: 'Default Trust Authority' });

        if (!defaultTrustAuthority) {
          // Create a default trust authority
          // Dynamic import can be slow or fail, handling it carefully
          const { generateKeyPair } = await import('../utils/encryption.js');
          const keys = await generateKeyPair(2048);

          const newTrustAuthority = new TrustAuthority({
            name: 'Default Trust Authority',
            description: 'Default trust authority for new users',
            administratorId: null, // Will be updated when admin assigns
            publicKey: keys.publicKey,
            privateKeyEncrypted: keys.privateKey, // In production, encrypt this
            createdBy: null,
          });

          await newTrustAuthority.save();
          userTrustAuthorityId = newTrustAuthority._id;
        } else {
          userTrustAuthorityId = defaultTrustAuthority._id;
        }
      } catch (taError) {
        console.error('[TRUST AUTHORITY ERROR]', taError);
        // Fallback: If TA creation fails (e.g. key gen issues), 
        // we allow user creation without TA if role permits?
        // System clients and SAs definitely need one usually. 
        // But preventing registration completely is bad.
        // We will log it and proceed with null check in future operations.
      }
    }

    user = new User({
      firstName,
      lastName,
      email,
      password,
      role, // already defaulted above
      permissions,
      trustAuthorityId: userTrustAuthorityId,
    });

    await user.save();

    await logAudit(req, res, {
      action: 'USER_CREATED',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: user.email,
      description: `New user registered: ${user.email}`,
      severity: 'high',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        trustAuthorityId: user.trustAuthorityId,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      user && (user.loginAttempts = (user.loginAttempts || 0) + 1);
      if (user && user.loginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      user && (await user.save());

      await logAudit(req, res, {
        action: 'FAILED_LOGIN',
        resourceType: 'User',
        resourceName: email,
        description: `Failed login attempt for user: ${email}`,
        status: 'failure',
        severity: 'high',
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is disabled',
      });
    }

    user.loginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // TEMPORARY: Bypass MFA check as requested by user
    /* 
    if (user.mfaEnabled) {
      return res.status(200).json({
        success: true,
        message: 'Please verify your MFA code',
        mfaRequired: true,
        email: user.email,
        userId: user._id,
      });
    }
    */

    user.lastLogin = new Date();
    await user.save();

    await logAudit(req, res, {
      action: 'LOGIN',
      userId: user._id,
      resourceType: 'User',
      resourceName: user.email,
      description: `User logged in successfully`,
      severity: 'low',
    });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
});

// @route   POST /api/auth/mfa/setup
// @desc    Setup MFA for user
// @access  Private
router.post('/mfa/setup', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const secret = speakeasy.generateSecret({
      name: `SCKLMS (${user.email})`,
      issuer: 'SCKLMS',
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    const backupCodes = generateBackupCodes();

    res.status(200).json({
      success: true,
      secret: secret.base32,
      qrCode,
      backupCodes,
      message: 'Scan QR code with your authenticator app',
    });
  } catch (error) {
    console.error('[MFA SETUP ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'MFA setup failed',
    });
  }
});

// @route   POST /api/auth/mfa/verify
// @desc    Verify and enable MFA
// @access  Private
router.post('/mfa/verify', protect, async (req, res) => {
  try {
    const { secret, token, backupCodes } = req.body;

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    const user = await User.findById(req.user._id);
    user.mfaEnabled = true;
    user.mfaType = 'totp';  // Explicitly set to 'totp' for authenticator app
    user.mfaSecret = secret;
    user.mfaBackupCodes = backupCodes;
    await user.save();

    await logAudit(req, res, {
      action: 'MFA_ENABLED',
      resourceType: 'User',
      resourceId: user._id,
      description: `MFA enabled for user`,
      severity: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'MFA enabled successfully',
    });
  } catch (error) {
    console.error('[MFA VERIFY ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'MFA verification failed',
    });
  }
});

// @route   POST /api/auth/mfa/validate
// @desc    Validate MFA token during login
// @access  Public
router.post('/mfa/validate', async (req, res) => {
  try {
    const { userId, token, useBackupCode } = req.body;

    const user = await User.findById(userId).select('+mfaSecret +mfaBackupCodes');

    if (!user || !user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA not enabled for this user',
      });
    }

    console.log(`[MFA VALIDATE] User: ${user.email}, MFA Type: ${user.mfaType}, Has Secret: ${!!user.mfaSecret}`);

    let isValid = false;

    if (useBackupCode) {
      const backupCodeIndex = user.mfaBackupCodes.indexOf(token);
      if (backupCodeIndex !== -1) {
        user.mfaBackupCodes.splice(backupCodeIndex, 1);
        await user.save();
        isValid = true;
      }
    } else if (user.mfaType === 'email') {
      if (user.emailOtp && user.emailOtp.code === token && new Date(user.emailOtp.expiresAt) > Date.now()) {
        isValid = true;
        user.emailOtp = undefined;
        await user.save();
      }
    } else {
      isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: 2,
      });
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid MFA code',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const authToken = generateToken(user._id);

    await logAudit(req, res, {
      action: 'LOGIN',
      userId: user._id,
      resourceType: 'User',
      resourceName: user.email,
      description: `User logged in with MFA verification`,
      severity: 'low',
    });

    res.status(200).json({
      success: true,
      token: authToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[MFA VALIDATE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'MFA validation failed',
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    await logAudit(req, res, {
      action: 'LOGOUT',
      resourceType: 'User',
      resourceName: req.user.email,
      description: `User logged out`,
      severity: 'low',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[LOGOUT ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit(req, res, {
      action: 'PASSWORD_CHANGED',
      resourceType: 'User',
      resourceId: user._id,
      description: `User changed password`,
      severity: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[CHANGE PASSWORD ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed',
    });
  }
});

// @route   PUT /api/auth/password
// @desc    Change user password (PUT method for settings page)
// @access  Private
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit(req, res, {
      action: 'PASSWORD_CHANGED',
      resourceType: 'User',
      resourceId: user._id,
      description: `User changed password`,
      severity: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[CHANGE PASSWORD ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed',
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, department } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (department !== undefined) updateData.department = department;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    await logAudit(req, res, {
      action: 'USER_UPDATED',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: user.email,
      description: `User updated their profile`,
      severity: 'low',
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('[UPDATE PROFILE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// @route   POST /api/auth/mfa/disable
// @desc    Disable MFA for current user
// @access  Private
router.post('/mfa/disable', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.mfaBackupCodes = [];
    user.mfaType = null;
    await user.save();

    await logAudit(req, res, {
      action: 'MFA_DISABLED',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: user.email,
      description: `User disabled MFA`,
      severity: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'MFA disabled successfully',
    });
  } catch (error) {
    console.error('[MFA DISABLE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable MFA',
    });
  }
});


// @route   GET /api/auth/account-info
// @desc    Get detailed account information
// @access  Private
router.get('/account-info', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        permissions: user.permissions,
        trustAuthorityId: user.trustAuthorityId,
      },
    });
  } catch (error) {
    console.error('[ACCOUNT INFO ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get account info',
    });
  }
});

export default router;

