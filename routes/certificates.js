import express from 'express';
import Certificate from '../models/Certificate.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import { encryptAES256, hashData } from '../utils/encryption.js';
import { logAudit, getSeverityByAction } from '../utils/auditLogger.js';
import crypto from 'crypto';
const router = express.Router();
const certificateId = crypto.randomUUID();
// @route   GET /api/certificates
// @desc    Get all certificates for user
// @access  Private
router.get('/', protect, checkPermission('view_certs'), async (req, res) => {
  try {
    const { status, sortBy } = req.query;
    let query = { $or: [{ createdBy: req.user._id }, { owner: req.user._id }] };

    if (status) {
      query.status = status;
    }

    let certificates = await Certificate.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('owner', 'firstName lastName email');

    if (sortBy === 'expiring') {
      certificates.sort((a, b) => a.validUntil - b.validUntil);
    } else if (sortBy === 'recent') {
      certificates.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    console.error('[GET CERTS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
    });
  }
});

// @route   GET /api/certificates/:id
// @desc    Get single certificate
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('owner', 'firstName lastName email');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    // Check access
    const hasAccess =
      certificate.createdBy._id.toString() === req.user._id.toString() ||
      certificate.owner._id.toString() === req.user._id.toString() ||
      req.user.role === 'security_authority';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this certificate',
      });
    }

    await logAudit(req, res, {
      action: 'VIEW_CERT',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      resourceName: certificate.name,
      description: `User viewed certificate: ${certificate.name}`,
      severity: 'low',
    });

    res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error('[GET CERT ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate',
    });
  }
});

// @route   POST /api/certificates
// @desc    Create new certificate
// @access  Private
router.post('/', protect, checkPermission('create_certs'), async (req, res) => {
  try {
    const { name, description, certificateData, issuer, subject, serialNumber, validFrom, validUntil, algorithm, tags, trustAuthorityId } = req.body;

    if (!name || !certificateData) {
      return res.status(400).json({
        success: false,
        message: 'Please provide certificate name and data',
      });
    }

    // Use provided trustAuthorityId or user's trustAuthorityId
    const userTrustAuthorityId = trustAuthorityId || req.user.trustAuthorityId;

    if (!userTrustAuthorityId) {
      console.error(`[CREATE CERT ERROR] User ${req.user.email} (${req.user._id}) has no trustAuthorityId`);
      return res.status(400).json({
        success: false,
        message: `No trust authority assigned to your account. Please contact administrator to assign a trust authority.`,
      });
    }
    const certificateHash = hashData(certificateData);

    const existingCert = await Certificate.findOne({ certificateHash });
    if (existingCert) {
      return res.status(400).json({
        success: false,
        message: 'This certificate already exists',
      });
    }

    const certificate = new Certificate({
      certificateId: crypto.randomUUID(),
      name,
      description,
      trustAuthorityId: userTrustAuthorityId,
      certificateData,
      certificateHash,
      issuer,
      subject,
      serialNumber,
      validFrom: validFrom || new Date(),
      validUntil: validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
      algorithm: algorithm || 'RSA-2048',
      signedBy: req.user._id,
      requestedBy: req.user._id,
      owner: req.user._id,
      createdBy: req.user._id,
      tags: tags || [],
      status: 'valid',
    });
    await certificate.save();

    await logAudit(req, res, {
      action: 'CREATE_CERT',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      resourceName: certificate.name,
      description: `User created new certificate: ${certificate.name}`,
      severity: 'high',
    });

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      data: certificate,
    });
  } catch (error) {
    console.error('[CREATE CERT ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create certificate',
    });
  }
});

// @route   PUT /api/certificates/:id
// @desc    Update certificate
// @access  Private
router.put('/:id', protect, checkPermission('create_certs'), async (req, res) => {
  try {
    let certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    // Check authorization
    if (certificate.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'security_authority') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this certificate',
      });
    }

    const allowedFields = ['name', 'description', 'status', 'tags', 'metadata'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field]) {
        updateData[field] = req.body[field];
      }
    });

    certificate = await Certificate.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await logAudit(req, res, {
      action: 'UPDATE_CERT',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      resourceName: certificate.name,
      description: `User updated certificate: ${certificate.name}`,
      severity: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'Certificate updated successfully',
      data: certificate,
    });
  } catch (error) {
    console.error('[UPDATE CERT ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update certificate',
    });
  }
});

// @route   DELETE /api/certificates/:id
// @desc    Delete certificate
// @access  Private
router.delete('/:id', protect, checkPermission('delete_certs'), async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    // Check authorization
    if (certificate.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'security_authority') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this certificate',
      });
    }

    await Certificate.findByIdAndDelete(req.params.id);

    await logAudit(req, res, {
      action: 'DELETE_CERT',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      resourceName: certificate.name,
      description: `User deleted certificate: ${certificate.name}`,
      severity: 'critical',
    });

    res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE CERT ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete certificate',
    });
  }
});

// @route   POST /api/certificates/:id/revoke
// @desc    Revoke certificate
// @access  Private
router.post('/:id/revoke', protect, checkPermission('revoke_certs'), async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    certificate.status = 'revoked';
    await certificate.save();

    await logAudit(req, res, {
      action: 'REVOKE_CERT',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      resourceName: certificate.name,
      description: `User revoked certificate: ${certificate.name}`,
      severity: 'critical',
    });

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      data: certificate,
    });
  } catch (error) {
    console.error('[REVOKE CERT ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke certificate',
    });
  }
});

// @route   POST /api/certificates/:id/sign
// @desc    Sign certificate digitally
// @access  Private
router.post('/:id/sign', protect, checkPermission('sign_verify'), async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    if (certificate.digitalSignature) {
      return res.status(400).json({
        success: false,
        message: 'Certificate is already signed',
      });
    }

    // Create a digital signature (simplified - should use real cryptography)
    const timestamp = new Date().toISOString();
    const signatureData = `${certificate.certificateHash}::${timestamp}::${req.user._id}`;
    const signatureHash = hashData(signatureData);

    certificate.digitalSignature = signatureHash;
    certificate.signedBy = req.user._id;
    certificate.status = 'valid';

    await certificate.save();

    await logAudit(req, res, {
      action: 'SIGN_CERTIFICATE',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      resourceName: certificate.name,
      description: `User digitally signed certificate: ${certificate.name}`,
      severity: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'Certificate signed successfully',
      data: certificate,
    });
  } catch (error) {
    console.error('[SIGN CERT ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign certificate',
    });
  }
});

// @route   POST /api/certificates/:id/verify-signature
// @desc    Verify certificate signature
// @access  Private
router.post('/:id/verify-signature', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id).populate('signedBy', 'firstName lastName email');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    if (!certificate.digitalSignature) {
      return res.status(400).json({
        success: true,
        verified: false,
        message: 'Certificate is not signed',
      });
    }

    const isValid = certificate.digitalSignature && certificate.signedBy;

    await logAudit(req, res, {
      action: 'VERIFY_SIGNATURE',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      resourceName: certificate.name,
      description: `User verified certificate signature: ${certificate.name}`,
      severity: 'medium',
    });

    res.status(200).json({
      success: true,
      verified: isValid,
      data: {
        certificateId: certificate._id,
        certificateName: certificate.name,
        signedBy: certificate.signedBy,
        signatureValid: isValid,
        digitalSignature: certificate.digitalSignature,
      },
    });
  } catch (error) {
    console.error('[VERIFY SIGNATURE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify signature',
    });
  }
});

export default router;
