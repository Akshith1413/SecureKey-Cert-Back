import express from 'express';
import CryptoKey from '../models/CryptoKey.js';
import { protect, checkPermission } from '../middleware/auth.js';
import { generateKeyPair, generateSymmetricKey, generateECDSAKeyPair, hashData, encryptAES256, signData, verifySignature } from '../utils/encryption.js';
import { logAudit, getSeverityByAction } from '../utils/auditLogger.js';
import crypto from 'crypto';
const keyId = crypto.randomUUID();
const router = express.Router();

const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

// @route   GET /api/keys
// @desc    Get all keys for user
// @access  Private
router.get('/', protect, checkPermission('view_keys'), async (req, res) => {
  try {
    const { status, keyType, sortBy } = req.query;
    let query = { $or: [{ createdBy: req.user._id }, { owner: req.user._id }] };

    if (status) {
      query.status = status;
    }
    if (keyType) {
      query.keyType = keyType;
    }

    let keys = await CryptoKey.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('owner', 'firstName lastName email')
      .select('-privateKey');

    if (sortBy === 'recent') {
      keys.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'rotation') {
      keys.sort((a, b) => a.nextRotationDue - b.nextRotationDue);
    }

    res.status(200).json({
      success: true,
      count: keys.length,
      data: keys,
    });
  } catch (error) {
    console.error('[GET KEYS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch keys',
    });
  }
});

// @route   GET /api/keys/:id
// @desc    Get single key
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const key = await CryptoKey.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('owner', 'firstName lastName email')
      .select('-privateKey');

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key not found',
      });
    }

    const hasAccess =
      key.createdBy._id.toString() === req.user._id.toString() ||
      key.owner._id.toString() === req.user._id.toString() ||
      req.user.role === 'security_authority';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this key',
      });
    }

    await logAudit(req, res, {
      action: 'VIEW_CERT',
      resourceType: 'CryptoKey',
      resourceId: key._id,
      resourceName: key.name,
      description: `User viewed key: ${key.name}`,
      severity: 'low',
    });

    res.status(200).json({
      success: true,
      data: key,
    });
  } catch (error) {
    console.error('[GET KEY ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch key',
    });
  }
});

// @route   POST /api/keys/generate
// @desc    Generate new cryptographic key
// @access  Private
router.post('/generate', protect, checkPermission('create_keys'), async (req, res) => {
  try {
    const { name, description, keyType, keyLength, tags, trustAuthorityId } = req.body;

    if (!name || !keyType || !keyLength) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, keyType, and keyLength',
      });
    }

    // Use provided trustAuthorityId or user's trustAuthorityId
    const userTrustAuthorityId = trustAuthorityId || req.user.trustAuthorityId;

    if (!userTrustAuthorityId) {
      return res.status(400).json({
        success: false,
        message: 'No trust authority assigned. Please contact administrator.',
      });
    }

    let publicKey = null;
    let privateKey = null;
    let keyData = null;

    if (keyType === 'RSA') {
      const keys = await generateKeyPair(keyLength);
      publicKey = keys.publicKey;
      privateKey = keys.privateKey;
    } else if (keyType === 'AES') {
      keyData = generateSymmetricKey(keyLength);
      publicKey = 'N/A';
      privateKey = keyData;
    } else if (keyType === 'ECDSA') {
      // Add ECDSA key generation with curve based on keyLength
      const keys = await generateECDSAKeyPair(keyLength);
      publicKey = keys.publicKey;
      privateKey = keys.privateKey;
    }

    const keyHash = hashData(publicKey + privateKey);

    const existingKey = await CryptoKey.findOne({ keyHash });
    if (existingKey) {
      return res.status(400).json({
        success: false,
        message: 'This key already exists',
      });
    }

    const encryptedPrivateKey = encryptAES256(privateKey);

    const rotationDates = {
      'monthly': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      'quarterly': new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      'annually': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      'manual': null,
    };
    const rotationPolicy = req.body.rotationPolicy || 'annually';
    const cryptoKey = new CryptoKey({
      keyId: crypto.randomUUID(),
      name,
      description,
      trustAuthorityId: userTrustAuthorityId,
      keyType,
      keyLength,
      publicKey,
      privateKeyEncrypted: JSON.stringify(encryptedPrivateKey),
      keyHash,
      createdBy: req.user._id,
      owner: req.user._id,
      validFrom: new Date(),
      validUntil: validUntil,
      nextRotationDue: rotationDates[rotationPolicy] || validUntil,
      rotationPolicy: rotationPolicy,
      tags: tags || [],
      status: 'active',
    });
    await cryptoKey.save();

    await logAudit(req, res, {
      action: 'CREATE_KEY',
      resourceType: 'CryptoKey',
      resourceId: cryptoKey._id,
      resourceName: cryptoKey.name,
      description: `User created new ${keyType} key: ${name}`,
      severity: 'high',
    });

    res.status(201).json({
      success: true,
      message: 'Key generated successfully',
      data: {
        _id: cryptoKey._id,
        name: cryptoKey.name,
        keyType: cryptoKey.keyType,
        keyLength: cryptoKey.keyLength,
        status: cryptoKey.status,
        publicKey: cryptoKey.publicKey,
        createdAt: cryptoKey.createdAt,
      },
    });
  } catch (error) {
    console.error('[GENERATE KEY ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate key',
    });
  }
});

// @route   POST /api/keys/:id/rotate
// @desc    Rotate cryptographic key
// @access  Private
router.post('/:id/rotate', protect, checkPermission('create_keys'), async (req, res) => {
  try {
    const oldKey = await CryptoKey.findById(req.params.id);

    if (!oldKey) {
      return res.status(404).json({
        success: false,
        message: 'Key not found',
      });
    }

    const hasAccess =
      oldKey.createdBy._id.toString() === req.user._id.toString() ||
      oldKey.owner._id.toString() === req.user._id.toString() ||
      req.user.role === 'security_authority';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rotate this key',
      });
    }

    let publicKey = null;
    let privateKey = null;

    if (oldKey.keyType === 'RSA') {
      const keys = await generateKeyPair(oldKey.keyLength);
      publicKey = keys.publicKey;
      privateKey = keys.privateKey;
    } else if (oldKey.keyType === 'AES') {
      privateKey = generateSymmetricKey(oldKey.keyLength);
      publicKey = 'N/A';
    } else if (oldKey.keyType === 'ECDSA') {
      const keys = await generateECDSAKeyPair(oldKey.keyLength);
      publicKey = keys.publicKey;
      privateKey = keys.privateKey;
    }

    const keyHash = hashData(publicKey + privateKey);
    const encryptedPrivateKey = encryptAES256(privateKey);

    oldKey.status = 'rotated';
    await oldKey.save();

    const newKey = new CryptoKey({
      keyId: crypto.randomUUID(),
      name: oldKey.name,
      description: oldKey.description,
      trustAuthorityId: oldKey.trustAuthorityId,
      keyType: oldKey.keyType,
      keyLength: oldKey.keyLength,
      publicKey,
      privateKeyEncrypted: JSON.stringify(encryptedPrivateKey),
      keyHash,
      createdBy: req.user._id,
      owner: oldKey.owner,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      lastRotated: new Date(),
      nextRotationDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      rotationPolicy: oldKey.rotationPolicy,
      tags: oldKey.tags,
      status: 'active',
    });

    await newKey.save();

    await logAudit(req, res, {
      action: 'ROTATE_KEY',
      resourceType: 'CryptoKey',
      resourceId: newKey._id,
      resourceName: newKey.name,
      description: `User rotated key: ${newKey.name}. Old key ID: ${oldKey._id}`,
      severity: 'high',
      affectedRecords: [
        { recordId: oldKey._id, recordType: 'CryptoKey' },
        { recordId: newKey._id, recordType: 'CryptoKey' },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Key rotated successfully',
      data: {
        oldKeyId: oldKey._id,
        newKeyId: newKey._id,
        newKey: {
          id: newKey._id,
          name: newKey.name,
          status: newKey.status,
          createdAt: newKey.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[ROTATE KEY ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rotate key',
    });
  }
});

// @route   POST /api/keys/:id/revoke
// @desc    Revoke key
// @access  Private
router.post('/:id/revoke', protect, checkPermission('delete_keys'), async (req, res) => {
  try {
    const key = await CryptoKey.findById(req.params.id);

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key not found',
      });
    }

    const hasAccess =
      key.createdBy._id.toString() === req.user._id.toString() ||
      key.owner._id.toString() === req.user._id.toString() ||
      req.user.role === 'security_authority';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to revoke this key',
      });
    }

    key.status = 'revoked';
    await key.save();

    await logAudit(req, res, {
      action: 'REVOKE_KEY',
      resourceType: 'CryptoKey',
      resourceId: key._id,
      resourceName: key.name,
      description: `User revoked key: ${key.name}`,
      severity: 'critical',
    });

    res.status(200).json({
      success: true,
      message: 'Key revoked successfully',
      data: key,
    });
  } catch (error) {
    console.error('[REVOKE KEY ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke key',
    });
  }
});

// @route   DELETE /api/keys/:id
// @desc    Delete key
// @access  Private
router.delete('/:id', protect, checkPermission('delete_keys'), async (req, res) => {
  try {
    const key = await CryptoKey.findById(req.params.id);

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key not found',
      });
    }

    const hasAccess =
      key.createdBy._id.toString() === req.user._id.toString() ||
      key.owner._id.toString() === req.user._id.toString() ||
      req.user.role === 'security_authority';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this key',
      });
    }

    await CryptoKey.findByIdAndDelete(req.params.id);

    await logAudit(req, res, {
      action: 'DELETE_KEY',
      resourceType: 'CryptoKey',
      resourceId: key._id,
      resourceName: key.name,
      description: `User deleted key: ${key.name}`,
      severity: 'critical',
    });

    res.status(200).json({
      success: true,
      message: 'Key deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE KEY ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete key',
    });
  }
});

// @route   POST /api/keys/encrypt
// @desc    Encrypt data with key
// @access  Private
router.post('/encrypt', protect, checkPermission('encrypt_decrypt'), async (req, res) => {
  try {
    const { keyId, data } = req.body;

    if (!keyId || !data) {
      return res.status(400).json({
        success: false,
        message: 'Please provide keyId and data',
      });
    }

    const key = await CryptoKey.findById(keyId).select('+privateKey');

    if (!key || key.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Key not found or not active',
      });
    }

    const encryptedData = encryptAES256(data);

    await logAudit(req, res, {
      action: 'ENCRYPT_DATA',
      resourceType: 'CryptoKey',
      resourceId: key._id,
      resourceName: key.name,
      description: `User encrypted data using key: ${key.name}`,
      severity: 'medium',
    });

    res.status(200).json({
      success: true,
      message: 'Data encrypted successfully',
      data: encryptedData,
    });
  } catch (error) {
    console.error('[ENCRYPT ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Encryption failed',
    });
  }
});

export default router;
