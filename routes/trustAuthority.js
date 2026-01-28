import express from 'express';
import TrustAuthority from '../models/TrustAuthority.js';
import RootKey from '../models/RootKey.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { protect as auth, authorize } from '../middleware/auth.js';
import { generateKeyPair, encryptAES256, hashData, signData } from '../utils/encryption.js';
import { logAudit } from '../utils/auditLogger.js';
import crypto from 'crypto';

const router = express.Router();

// Create Trust Authority (Security Authority only)
router.post('/create', auth, authorize('security_authority'), async (req, res) => {
  try {
    const { name, description, keyLength = 2048 } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ success: false, message: 'Trust Authority name is required' });
    }

    // Check if name already exists
    const existingAuthority = await TrustAuthority.findOne({ name });
    if (existingAuthority) {
      return res.status(400).json({ success: false, message: 'Trust Authority name already exists' });
    }

    // Generate RSA key pair for the Trust Authority
    const { publicKey, privateKey } = await generateKeyPair(keyLength);

    // Encrypt private key with AES-256
    const encryptedPrivateKey = encryptAES256(privateKey, process.env.MASTER_ENCRYPTION_KEY);

    // Create Trust Authority first (so we have the ID for RootKey)
    const trustAuthority = new TrustAuthority({
      name,
      description,
      administratorId: req.user.id,
      publicKey,
      privateKeyEncrypted: JSON.stringify(encryptedPrivateKey),
      createdBy: req.user.id,
    });

    await trustAuthority.save();

    // Create Root Key document with all required fields
    const rootKey = new RootKey({
      keyId: crypto.randomUUID(),
      trustAuthorityId: trustAuthority._id,
      publicKey,
      privateKeyEncrypted: JSON.stringify(encryptedPrivateKey),
      keyLength,
      encryptionKeyHash: hashData(publicKey + privateKey),
      createdBy: req.user.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    await rootKey.save();

    // Update Trust Authority with root key reference
    trustAuthority.rootKeyId = rootKey._id;
    await trustAuthority.save();

    // Log action
    await logAudit(req, null, {
      action: 'CREATE_TRUST_AUTHORITY',
      resourceType: 'TrustAuthority',
      resourceId: trustAuthority._id,
      resourceName: trustAuthority.name,
      description: `User created Trust Authority: ${trustAuthority.name}`,
      severity: 'high',
    });

    res.status(201).json({
      success: true,
      message: 'Trust Authority created successfully',
      data: {
        id: trustAuthority._id,
        name: trustAuthority.name,
        status: trustAuthority.status,
        keyLength: trustAuthority.keyLength,
        trustLevel: trustAuthority.trustLevel,
      },
    });
  } catch (error) {
    console.error('Error creating Trust Authority:', error);
    res.status(500).json({ success: false, message: 'Failed to create Trust Authority', error: error.message });
  }
});

// Get all Trust Authorities
router.get('/', auth, async (req, res) => {
  try {
    const query = {};

    // Filter by user role
    if (req.user.role === 'auditor') {
      query.status = 'active';
    }

    const authorities = await TrustAuthority.find(query)
      .populate('administratorId', 'email firstName lastName')
      .populate('rootKeyId', 'algorithm keyLength status')
      .select('-privateKeyEncrypted');

    res.json({
      success: true,
      count: authorities.length,
      data: authorities,
    });
  } catch (error) {
    console.error('Error fetching Trust Authorities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Trust Authorities' });
  }
});

// Get specific Trust Authority
router.get('/:id', auth, async (req, res) => {
  try {
    const authority = await TrustAuthority.findById(req.params.id)
      .populate('administratorId', 'email firstName lastName')
      .populate('rootKeyId', 'algorithm keyLength status trustScore')
      .select('-privateKeyEncrypted');

    if (!authority) {
      return res.status(404).json({ success: false, message: 'Trust Authority not found' });
    }

    res.json({
      success: true,
      data: authority,
    });
  } catch (error) {
    console.error('Error fetching Trust Authority:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Trust Authority' });
  }
});

// Update Trust Authority status
router.patch('/:id/status', auth, authorize('security_authority'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended', 'revoked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const authority = await TrustAuthority.findByIdAndUpdate(req.params.id, { status }, { new: true });

    await logAudit(req, null, {
      action: 'UPDATE_TRUST_AUTHORITY',
      resourceType: 'TrustAuthority',
      resourceId: authority._id,
      resourceName: authority.name,
      description: `User updated Trust Authority status: ${authority.name}`,
      severity: 'high',
    });

    res.json({
      success: true,
      message: 'Trust Authority status updated',
      data: authority,
    });
  } catch (error) {
    console.error('Error updating Trust Authority:', error);
    res.status(500).json({ success: false, message: 'Failed to update Trust Authority' });
  }
});

// Get Trust Authority Statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const authority = await TrustAuthority.findById(req.params.id);

    if (!authority) {
      return res.status(404).json({ success: false, message: 'Trust Authority not found' });
    }

    const stats = {
      issuedCertificates: authority.issuedCertificatesCount,
      revokedCertificates: authority.revokedCertificatesCount,
      trustLevel: authority.trustLevel,
      policyVersion: authority.policyVersion,
      certificateLifetime: authority.certificateLifetime,
      status: authority.status,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

export default router;
