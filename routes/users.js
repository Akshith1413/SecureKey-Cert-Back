import express from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[GET PROFILE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private
router.get('/', protect, authorize('security_authority'), async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('permissions');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('[GET USERS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user (Admin only)
// @access  Private
router.get('/:id', protect, authorize('security_authority'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[GET USER ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private
router.put('/:id', protect, authorize('security_authority'), async (req, res) => {
  try {
    const { firstName, lastName, department, role, permissions, isActive } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (department) updateData.department = department;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await logAudit(req, res, {
      action: 'USER_UPDATED',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: user.email,
      description: `Admin updated user: ${user.email}`,
      severity: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('[UPDATE USER ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private
router.delete('/:id', protect, authorize('security_authority'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'security_authority') {
      const adminCount = await User.countDocuments({ role: 'security_authority' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last security admin',
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    await logAudit(req, res, {
      action: 'USER_DELETED',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: user.email,
      description: `Admin deleted user: ${user.email}`,
      severity: 'critical',
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE USER ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
});

// @route   POST /api/users/:id/disable
// @desc    Disable/Activate user (Admin only)
// @access  Private
router.post('/:id/disable', protect, authorize('security_authority'), async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await logAudit(req, res, {
      action: 'USER_UPDATED',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: user.email,
      description: `User account ${isActive ? 'activated' : 'disabled'}: ${user.email}`,
      severity: 'high',
    });

    res.status(200).json({
      success: true,
      message: `User account ${isActive ? 'activated' : 'disabled'} successfully`,
      data: user,
    });
  } catch (error) {
    console.error('[DISABLE USER ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
    });
  }
});

// @route   POST /api/users/:id/reset-mfa
// @desc    Reset MFA for user (Admin only)
// @access  Private
router.post('/:id/reset-mfa', protect, authorize('security_authority'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.mfaBackupCodes = [];
    await user.save();

    await logAudit(req, res, {
      action: 'MFA_DISABLED',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: user.email,
      description: `Admin reset MFA for user: ${user.email}`,
      severity: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'MFA reset successfully',
      data: user,
    });
  } catch (error) {
    console.error('[RESET MFA ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset MFA',
    });
  }
});

export default router;
