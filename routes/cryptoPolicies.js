import express from 'express';
import CryptoPolicy from '../models/CryptoPolicy.js';
import TrustAuthority from '../models/TrustAuthority.js';
import User from '../models/User.js';
import { protect as auth, authorize } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';
import crypto from 'crypto';

const router = express.Router();

// Create new Crypto Policy (Security Authority only)
router.post('/create', auth, authorize(['security_authority']), async (req, res) => {
  try {
    const {
      policyName,
      trustAuthorityId,
      keyLengthRequirements,
      certificateValidity,
      encryptionAlgorithm,
      hashAlgorithm,
      signingAlgorithm,
      accessControl,
      keyRotation,
      complianceRequirements,
      description,
    } = req.body;

    if (!policyName || !trustAuthorityId) {
      return res.status(400).json({ success: false, message: 'Policy name and Trust Authority ID are required' });
    }

    // Verify Trust Authority exists
    const trustAuthority = await TrustAuthority.findById(trustAuthorityId);
    if (!trustAuthority) {
      return res.status(404).json({ success: false, message: 'Trust Authority not found' });
    }

    // Check for duplicate policy name
    const existingPolicy = await CryptoPolicy.findOne({ policyName });
    if (existingPolicy) {
      return res.status(400).json({ success: false, message: 'Policy name already exists' });
    }

    const policy = new CryptoPolicy({
      policyName,
      trustAuthorityId,
      createdBy: req.user.id,
      keyLengthRequirements: keyLengthRequirements || {},
      certificateValidity: certificateValidity || {},
      encryptionAlgorithm: encryptionAlgorithm || 'aes-256-gcm',
      hashAlgorithm: hashAlgorithm || 'sha256',
      signingAlgorithm: signingAlgorithm || 'RSA-2048',
      accessControl: accessControl || {
        allowedRoles: ['security_authority', 'system_client', 'auditor'],
        canIssue: 'security_authority',
        canRevoke: 'security_authority',
        canAccess: ['security_authority', 'system_client'],
      },
      keyRotation: keyRotation || {},
      complianceRequirements: complianceRequirements || {},
      description,
    });

    await policy.save();

    // Log action
    await logAudit(req, null, {
      action: 'CREATE_POLICY',
      resourceType: 'CryptoPolicy',
      resourceId: policy._id,
      resourceName: policy.policyName,
      description: `User created Crypto Policy: ${policy.policyName}`,
      severity: 'high',
    });

    res.status(201).json({
      success: true,
      message: 'Crypto Policy created successfully',
      data: {
        id: policy._id,
        policyName: policy.policyName,
        status: policy.status,
        policyVersion: policy.policyVersion,
      },
    });
  } catch (error) {
    console.error('Error creating Crypto Policy:', error);
    res.status(500).json({ success: false, message: 'Failed to create Crypto Policy', error: error.message });
  }
});

// Get all Crypto Policies
router.get('/', auth, async (req, res) => {
  try {
    const query = { status: 'active' };

    const policies = await CryptoPolicy.find(query)
      .populate('createdBy', 'email firstName lastName')
      .populate('trustAuthorityId', 'name status');

    res.json({
      success: true,
      count: policies.length,
      data: policies,
    });
  } catch (error) {
    console.error('Error fetching Crypto Policies:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Crypto Policies' });
  }
});

// Get specific Crypto Policy
router.get('/:id', auth, async (req, res) => {
  try {
    const policy = await CryptoPolicy.findById(req.params.id)
      .populate('createdBy', 'email firstName lastName')
      .populate('trustAuthorityId', 'name');

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Crypto Policy not found' });
    }

    res.json({
      success: true,
      data: policy,
    });
  } catch (error) {
    console.error('Error fetching Crypto Policy:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Crypto Policy' });
  }
});

// Update Crypto Policy
router.patch('/:id', auth, authorize(['security_authority']), async (req, res) => {
  try {
    const { keyLengthRequirements, certificateValidity, encryptionAlgorithm, hashAlgorithm, signingAlgorithm, accessControl, description } = req.body;

    const policy = await CryptoPolicy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Crypto Policy not found' });
    }

    // Update fields
    if (keyLengthRequirements) policy.keyLengthRequirements = keyLengthRequirements;
    if (certificateValidity) policy.certificateValidity = certificateValidity;
    if (encryptionAlgorithm) policy.encryptionAlgorithm = encryptionAlgorithm;
    if (hashAlgorithm) policy.hashAlgorithm = hashAlgorithm;
    if (signingAlgorithm) policy.signingAlgorithm = signingAlgorithm;
    if (accessControl) policy.accessControl = accessControl;
    if (description) policy.description = description;

    policy.policyVersion += 1;
    await policy.save();

    await logAudit(req, null, {
      action: 'UPDATE_POLICY',
      resourceType: 'CryptoPolicy',
      resourceId: policy._id,
      resourceName: policy.policyName,
      description: `User updated Crypto Policy: ${policy.policyName}`,
      severity: 'high',
    });

    res.json({
      success: true,
      message: 'Crypto Policy updated successfully',
      data: policy,
    });
  } catch (error) {
    console.error('Error updating Crypto Policy:', error);
    res.status(500).json({ success: false, message: 'Failed to update Crypto Policy' });
  }
});

// Deactivate Policy
router.patch('/:id/deactivate', auth, authorize(['security_authority']), async (req, res) => {
  try {
    const policy = await CryptoPolicy.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });

    await logAudit(req, null, {
      action: 'UPDATE_POLICY',
      resourceType: 'CryptoPolicy',
      resourceId: policy._id,
      resourceName: policy.policyName,
      description: `User deactivated Crypto Policy: ${policy.policyName}`,
      severity: 'high',
    });

    res.json({
      success: true,
      message: 'Crypto Policy deactivated',
      data: policy,
    });
  } catch (error) {
    console.error('Error deactivating policy:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate policy' });
  }
});

// Get Policy Details
router.get('/:id/details', auth, async (req, res) => {
  try {
    const policy = await CryptoPolicy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    const details = {
      id: policy._id,
      policyName: policy.policyName,
      version: policy.policyVersion,
      encryptionRequirements: {
        algorithm: policy.encryptionAlgorithm,
        hashAlgorithm: policy.hashAlgorithm,
        signingAlgorithm: policy.signingAlgorithm,
      },
      keyRequirements: policy.keyLengthRequirements,
      certificateValidity: policy.certificateValidity,
      accessControl: policy.accessControl,
      complianceRequirements: policy.complianceRequirements,
      rotationPolicy: policy.keyRotation,
    };

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error('Error fetching policy details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch policy details' });
  }
});

export default router;
