import crypto from 'crypto';
import AuditLog from '../models/AuditLog.js';

export const logAudit = async (req, resOrData, auditDataArg) => {
  try {
    // Handle both (req, auditData) and (req, res, auditData) signatures
    // If auditDataArg is provided, then resOrData is the response object (ignore it)
    // If auditDataArg is not provided, then resOrData is the auditData
    const auditData = auditDataArg !== undefined ? auditDataArg : resOrData;

    // Handle cases like register where req.user may not exist yet
    const userId = auditData.userId || req.user?._id;
    if (!userId) {
      console.warn('[AUDIT LOG] Skipped: no userId available');
      return false;
    }

    // Generate unique logId
    const logId = crypto.randomUUID();

    // Get previous log for chaining
    const lastLog = await AuditLog.findOne().sort({ createdAt: -1 }).select('logHash');
    const previousLogHash = lastLog?.logHash || null;

    // Build hash input (tamper-proof chain)
    const hashPayload = JSON.stringify({
      logId,
      userId,
      action: auditData.action,
      resourceType: auditData.resourceType,
      resourceId: auditData.resourceId,
      timestamp: Date.now(),
      previousLogHash,
    });

    const logHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const log = new AuditLog({
      logId,
      logHash,
      previousLogHash,

      action: auditData.action,
      userId,
      userName: auditData.userName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System'),
      userRole: auditData.userRole || req.user?.role,

      resourceType: auditData.resourceType,
      resourceId: auditData.resourceId,
      resourceName: auditData.resourceName,

      description: auditData.description,
      status: auditData.status || 'success',
      severity: auditData.severity || 'medium',

      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get?.('user-agent'),

      details: auditData.details,
      affectedRecords: auditData.affectedRecords,
    });

    await log.save();
    return true;
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', error);
    return false;
  }
};

export const getSeverityByAction = (action) => {
  const criticalActions = [
    'DELETE_KEY',
    'REVOKE_KEY',
    'DELETE_CERT',
    'REVOKE_CERT',
    'USER_DELETED',
    'EXPORT_AUDIT_LOG',
  ];

  const highActions = [
    'CREATE_KEY',
    'UPDATE_KEY',
    'CREATE_CERT',
    'UPDATE_CERT',
    'ROTATE_KEY',
    'PERMISSION_CHANGED',
    'USER_CREATED',
    'PASSWORD_CHANGED',
  ];

  if (criticalActions.includes(action)) return 'critical';
  if (highActions.includes(action)) return 'high';
  return 'medium';
};
