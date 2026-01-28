import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

// @route   GET /api/audit-logs
// @desc    Get audit logs (users with view_audit_logs permission)
// @access  Private
router.get('/', protect, checkPermission('view_audit_logs'), async (req, res) => {
  try {
    const { action, severity, resourceType, startDate, endDate, limit = 100, skip = 0 } = req.query;

    let query = {};

    if (action) {
      query.action = action;
    }
    if (severity) {
      query.severity = severity;
    }
    if (resourceType) {
      query.resourceType = resourceType;
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      data: logs,
    });
  } catch (error) {
    console.error('[GET AUDIT LOGS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
    });
  }
});

// @route   GET /api/audit-logs/:id
// @desc    Get single audit log
// @access  Private
router.get('/:id', protect, authorize('auditor', 'security_authority'), async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('userId', 'firstName lastName email role');

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found',
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('[GET AUDIT LOG ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
    });
  }
});

// @route   GET /api/audit-logs/user/:userId
// @desc    Get audit logs for specific user
// @access  Private
router.get('/user/:userId', protect, authorize('auditor', 'security_authority'), async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;

    const logs = await AuditLog.find({ userId: req.params.userId })
      .populate('userId', 'firstName lastName email role')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments({ userId: req.params.userId });

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      data: logs,
    });
  } catch (error) {
    console.error('[GET USER AUDIT LOGS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user audit logs',
    });
  }
});

// @route   GET /api/audit-logs/resource/:resourceType/:resourceId
// @desc    Get audit logs for specific resource
// @access  Private
router.get('/resource/:resourceType/:resourceId', protect, authorize('auditor', 'security_authority'), async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    const logs = await AuditLog.find({
      resourceType,
      resourceId,
    })
      .populate('userId', 'firstName lastName email role')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments({ resourceType, resourceId });

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      data: logs,
    });
  } catch (error) {
    console.error('[GET RESOURCE AUDIT LOGS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource audit logs',
    });
  }
});

// @route   GET /api/audit-logs/export
// @desc    Export audit logs
// @access  Private
router.get('/export', protect, authorize('auditor', 'security_authority'), async (req, res) => {
  try {
    const { action, severity, resourceType, startDate, endDate } = req.query;

    let query = {};

    if (action) {
      query.action = action;
    }
    if (severity) {
      query.severity = severity;
    }
    if (resourceType) {
      query.resourceType = resourceType;
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const logs = await AuditLog.find(query).populate('userId', 'firstName lastName email role');

    // Convert to CSV format
    const csvHeader = [
      'Timestamp',
      'User',
      'Action',
      'Resource Type',
      'Resource Name',
      'Status',
      'Severity',
      'Description',
    ];

    const csvRows = logs.map((log) => [
      log.createdAt.toISOString(),
      log.userName,
      log.action,
      log.resourceType,
      log.resourceName,
      log.status,
      log.severity,
      log.description,
    ]);

    const csvContent = [csvHeader, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    await logAudit(req, res, {
      action: 'EXPORT_AUDIT_LOG',
      resourceType: 'AuditLog',
      description: `User exported ${logs.length} audit logs`,
      severity: 'medium',
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('[EXPORT AUDIT LOGS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
    });
  }
});

// @route   GET /api/audit-logs/stats/summary
// @desc    Get audit logs summary statistics
// @access  Private
router.get('/stats/summary', protect, authorize('auditor', 'security_authority'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const totalLogs = await AuditLog.countDocuments(query);

    const actionStats = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const severityStats = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const userStats = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalLogs,
        actionStats,
        severityStats,
        topUsers: userStats,
      },
    });
  } catch (error) {
    console.error('[AUDIT STATS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
    });
  }
});

export default router;
