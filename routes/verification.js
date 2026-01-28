import express from 'express';
import VerificationRequest from '../models/VerificationRequest.js';
import Certificate from '../models/Certificate.js';
import TrustAuthority from '../models/TrustAuthority.js'; // Import TrustAuthority model
import { protect as auth } from '../middleware/auth.js';
import { hashData, verifySignature, detectMITMAttack, detectReplayAttack, generateNonce, verifyFileIntegrity } from '../utils/encryption.js';
import { logAudit } from '../utils/auditLogger.js';
import crypto from 'crypto';

const router = express.Router();

const NONCE_STORAGE = new Map(); // In production, use Redis
const NONCE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Verify Certificate Integrity
router.post('/verify-integrity', auth, async (req, res) => {
  try {
    const { certificateId, fileData, providedSignature } = req.body;

    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID is required'
      });
    }
    let certificate;

    // Check if it's a valid MongoDB ObjectId
    if (certificateId.match(/^[0-9a-fA-F]{24}$/)) {
      certificate = await Certificate.findById(certificateId).select('+digitalSignature');
    }
    if (!certificate) {
      certificate = await Certificate.findOne({ certificateId: certificateId }).select('+digitalSignature');
    }
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found. Please check the certificate ID.'
      });
    }


    // Check if certificate is revoked
    if (certificate.revocation.isRevoked) {
      return res.status(400).json({
        success: false,
        message: 'Certificate has been revoked',
        tampered: true,
      });
    }

    // Check if certificate is expired
    if (new Date() > certificate.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Certificate has expired',
        tampered: true,
      });
    }

    // Compute hash of provided file data
    const computedHash = hashData(fileData);

    // Verify signature if provided
    let signatureValid = true;
    if (providedSignature && certificate.digitalSignature) {
      try {
        // Get trust authority's public key to verify signature
        const trustAuthority = await TrustAuthority.findById(certificate.trustAuthorityId);
        if (trustAuthority && trustAuthority.publicKey) {
          signatureValid = verifySignature(fileData, providedSignature, trustAuthority.publicKey);
        } else {
          signatureValid = false;
        }
      } catch (error) {
        signatureValid = false;
      }
    }

    // Check for tampering
    const integrityCheck = verifyFileIntegrity(fileData, certificate.certificateHash);

    // Detect MITM attack
    const mitmCheck = detectMITMAttack(fileData, certificate.certificateData);

    // Create verification request record
    const verificationRequest = new VerificationRequest({
      requestId: crypto.randomUUID(),
      userId: req.user.id,
      certificateId: certificate._id,
      fileHash: computedHash,
      verificationDetails: {
        hashAlgorithm: 'sha256',
        signatureAlgorithm: certificate.signatureAlgorithm,
        computedHash,
        providedSignature,
        signatureValid,
      },
      verificationResult: {
        isValid: signatureValid && integrityCheck.match,
        integrityCompromised: integrityCheck.tampered,
        certificateValid: true,
        certificateExpired: new Date() > certificate.validUntil,
        certificateRevoked: certificate.revocation.isRevoked,
        reasons: integrityCheck.tampered ? ['Data tampering detected'] : [],
      },
      tamperDetection: {
        detectedTamper: integrityCheck.tampered,
        comparisonResult: {
          originalHash: certificate.certificateHash,
          currentHash: computedHash,
          match: integrityCheck.match,
        },
      },
      mitmRiskAssessment: {
        riskLevel: mitmCheck.detected ? 'high' : 'low',
        indicators: mitmCheck.indicators,
      },
      status: integrityCheck.tampered ? 'tampered' : 'verified',
    });

    await verificationRequest.save();

    // Log action
    await logAudit(req, null, {
      action: 'VERIFY_SIGNATURE_FILE',
      resourceType: 'VerificationRequest',
      resourceId: verificationRequest._id,
      description: 'File integrity verified',
      severity: 'medium',
    });

    res.json({
      success: true,
      message: integrityCheck.tampered ? 'File integrity compromised' : 'File integrity verified',
      data: {
        verificationId: verificationRequest._id,
        isValid: verificationRequest.verificationResult.isValid,
        tampered: integrityCheck.tampered,
        signatureValid,
        certificateStatus: certificate.status,
        certificateExpired: new Date() > certificate.validUntil,
        mitmRiskLevel: mitmCheck.riskLevel,
        details: verificationRequest.verificationResult,
      },
    });
  } catch (error) {
    console.error('Error verifying integrity:', error);
    res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
});

// Check for Replay Attacks
router.post('/check-replay', auth, async (req, res) => {
  try {
    const { nonce, data } = req.body;

    if (!nonce) {
      return res.status(400).json({ success: false, message: 'Nonce is required' });
    }

    // Check if nonce exists in storage (replay attack indicator)
    const replayCheck = detectReplayAttack(nonce, Array.from(NONCE_STORAGE.keys()));

    if (replayCheck.isReplay) {
      await logAudit(req, null, {
        action: 'VERIFY_SIGNATURE_FILE',
        resourceType: 'System',
        description: 'Potential replay attack detected',
        severity: 'critical',
      });

      return res.status(400).json({
        success: false,
        message: 'Replay attack detected',
        riskLevel: 'critical',
      });
    }

    // Store nonce
    NONCE_STORAGE.set(nonce, { timestamp: Date.now(), userId: req.user.id });

    // Clean up expired nonces
    for (const [storedNonce, data] of NONCE_STORAGE.entries()) {
      if (Date.now() - data.timestamp > NONCE_EXPIRY) {
        NONCE_STORAGE.delete(storedNonce);
      }
    }

    res.json({
      success: true,
      message: 'Nonce verified - no replay attack detected',
      riskLevel: 'low',
    });
  } catch (error) {
    console.error('Error checking replay attack:', error);
    res.status(500).json({ success: false, message: 'Replay check failed' });
  }
});

// Request Verification
router.post('/request', auth, async (req, res) => {
  try {
    const { certificateId } = req.body;

    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const verificationRequest = new VerificationRequest({
      requestId: crypto.randomUUID(),
      userId: req.user.id,
      certificateId,
      fileHash: certificate.certificateHash,
      status: 'pending',
    });

    await verificationRequest.save();

    await logAudit(req, null, {
      action: 'VERIFY_SIGNATURE_FILE',
      resourceType: 'VerificationRequest',
      resourceId: verificationRequest._id,
      description: 'Verification request created',
      severity: 'medium',
    });

    res.status(201).json({
      success: true,
      message: 'Verification request created',
      data: {
        verificationId: verificationRequest._id,
        status: verificationRequest.status,
      },
    });
  } catch (error) {
    console.error('Error creating verification request:', error);
    res.status(500).json({ success: false, message: 'Failed to create verification request' });
  }
});

// Get Verification Request Status
router.get('/:verificationId', auth, async (req, res) => {
  try {
    const verificationRequest = await VerificationRequest.findById(req.params.verificationId);

    if (!verificationRequest) {
      return res.status(404).json({ success: false, message: 'Verification request not found' });
    }

    res.json({
      success: true,
      data: verificationRequest,
    });
  } catch (error) {
    console.error('Error fetching verification request:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch verification request' });
  }
});

// Get all Verifications by User
router.get('/user/all', auth, async (req, res) => {
  try {
    const verifications = await VerificationRequest.find({ userId: req.user.id })
      .populate('certificateId', 'name status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: verifications.length,
      data: verifications,
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch verifications' });
  }
});

// Generate Nonce for secure request
router.post('/generate-nonce', auth, async (req, res) => {
  try {
    const nonce = generateNonce();
    NONCE_STORAGE.set(nonce, { timestamp: Date.now(), userId: req.user.id });

    res.json({
      success: true,
      nonce,
      expiresIn: NONCE_EXPIRY,
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    res.status(500).json({ success: false, message: 'Failed to generate nonce' });
  }
});

export default router;
