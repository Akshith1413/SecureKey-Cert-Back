import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper function to get default permissions based on role
const getDefaultPermissions = (role) => {
  switch (role) {
    case 'security_authority':
      return [
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
    case 'system_client':
      return [
        'view_certs',
        'view_keys',
        'encrypt_decrypt',
        'sign_verify',
        'create_keys',
        'create_certs',
        'view_audit_logs',
      ];
    case 'auditor':
      return [
        'view_certs',
        'view_keys',
        'view_audit_logs',
        'export_data',
        'verify_signatures',
      ];
    default:
      return [];
  }
};

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'User account is disabled' });
    }

    // Auto-populate permissions if empty (fixes existing users created before permissions were assigned)
    if (!req.user.permissions || req.user.permissions.length === 0) {
      req.user.permissions = getDefaultPermissions(req.user.role);
      // Optionally persist this fix to the database (uncomment if you want to save it)
      // await User.findByIdAndUpdate(req.user._id, { permissions: req.user.permissions });
    }

    // Add trustAuthorityId to req.user for easier access
    req.user.trustAuthorityId = req.user.trustAuthorityId;

    next();
  } catch (error) {
    console.error('[AUTH ERROR]', error);
    res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

export const authorize = (...roles) => {
  // Flatten in case an array is passed directly (e.g., authorize(['role1', 'role2']))
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `User does not have '${permission}' permission`,
      });
    }
    next();
  };
};
