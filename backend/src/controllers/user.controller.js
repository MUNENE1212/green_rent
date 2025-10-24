/**
 * User Controller
 * Handles user profile management, documents, and settings
 */

import { User } from '../models/index.js';
import ApiResponse from '../utils/apiResponse.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * Get all users (Admin only)
 * GET /api/v1/users
 */
export const getAllUsers = catchAsync(async (req, res) => {
  const {
    role,
    status,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build filter
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  // Calculate pagination
  const skip = (page - 1) * limit;
  const sortOrder = order === 'desc' ? -1 : 1;

  // Execute query
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-security.refreshTokens -verification.emailVerificationToken')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter)
  ]);

  return ApiResponse.paginated(res, 200, 'Users retrieved successfully', {
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
export const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if user can access this profile
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return ApiResponse.forbidden(res, 'You can only access your own profile');
  }

  const user = await User.findById(id)
    .select('-security.refreshTokens -verification.emailVerificationToken')
    .populate('documents.verifiedBy', 'profile.firstName profile.lastName email');

  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  return ApiResponse.success(res, 200, 'User retrieved successfully', { user });
});

/**
 * Update user profile
 * PUT /api/v1/users/:id
 */
export const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if user can update this profile
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return ApiResponse.forbidden(res, 'You can only update your own profile');
  }

  const {
    profile,
    financialProfile,
    preferences,
    documents
  } = req.body;

  // Fields that can be updated
  const updateFields = {};

  if (profile) {
    // Validate and update profile fields
    const allowedProfileFields = [
      'firstName',
      'lastName',
      'avatar',
      'dateOfBirth',
      'gender',
      'nationality',
      'nationalId',
      'occupation',
      'employer',
      'address',
      'emergencyContact'
    ];

    Object.keys(profile).forEach(key => {
      if (allowedProfileFields.includes(key)) {
        updateFields[`profile.${key}`] = profile[key];
      }
    });
  }

  if (financialProfile && req.user.role !== 'admin') {
    // Users can update their financial info (except credit score)
    const allowedFinancialFields = [
      'monthlyIncome',
      'incomeFrequency',
      'employmentType',
      'bankName',
      'accountNumber',
      'mpesaNumber'
    ];

    Object.keys(financialProfile).forEach(key => {
      if (allowedFinancialFields.includes(key)) {
        updateFields[`financialProfile.${key}`] = financialProfile[key];
      }
    });
  }

  if (preferences) {
    updateFields.preferences = { ...updateFields.preferences, ...preferences };
  }

  // Update user
  const user = await User.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select('-security.refreshTokens -verification.emailVerificationToken');

  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  return ApiResponse.success(res, 200, 'Profile updated successfully', { user });
});

/**
 * Delete user account
 * DELETE /api/v1/users/:id
 */
export const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check permissions
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return ApiResponse.forbidden(res, 'You can only delete your own account');
  }

  const user = await User.findById(id);

  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  // Soft delete - mark as deleted instead of removing
  user.status = 'deleted';
  await user.save();

  return ApiResponse.success(res, 200, 'Account deleted successfully');
});

/**
 * Upload user document
 * POST /api/v1/users/:id/documents
 */
export const uploadDocument = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check permissions
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return ApiResponse.forbidden(res, 'You can only upload to your own profile');
  }

  const { type, name, url, expiryDate } = req.body;

  if (!type || !name || !url) {
    return ApiResponse.error(res, 400, 'Document type, name, and URL are required');
  }

  const user = await User.findById(id);

  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  // Add document
  user.documents.push({
    type,
    name,
    url,
    expiryDate,
    uploadedAt: Date.now()
  });

  await user.save();

  return ApiResponse.success(res, 201, 'Document uploaded successfully', {
    document: user.documents[user.documents.length - 1]
  });
});

/**
 * Verify user document (Admin only)
 * PUT /api/v1/users/:id/documents/:documentId/verify
 */
export const verifyDocument = catchAsync(async (req, res) => {
  const { id, documentId } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  const document = user.documents.id(documentId);

  if (!document) {
    return ApiResponse.notFound(res, 'Document not found');
  }

  document.verified = true;
  document.verifiedBy = req.user._id;
  document.verifiedAt = Date.now();

  await user.save();

  return ApiResponse.success(res, 200, 'Document verified successfully', { document });
});

/**
 * Delete user document
 * DELETE /api/v1/users/:id/documents/:documentId
 */
export const deleteDocument = catchAsync(async (req, res) => {
  const { id, documentId } = req.params;

  // Check permissions
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return ApiResponse.forbidden(res, 'You can only delete your own documents');
  }

  const user = await User.findById(id);

  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  const document = user.documents.id(documentId);

  if (!document) {
    return ApiResponse.notFound(res, 'Document not found');
  }

  // Remove document
  user.documents.pull(documentId);
  await user.save();

  return ApiResponse.success(res, 200, 'Document deleted successfully');
});

/**
 * Update user status (Admin only)
 * PUT /api/v1/users/:id/status
 */
export const updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const validStatuses = ['active', 'suspended', 'banned', 'deleted'];

  if (!status || !validStatuses.includes(status)) {
    return ApiResponse.error(res, 400, 'Valid status is required (active, suspended, banned, deleted)');
  }

  const user = await User.findById(id);

  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  user.status = status;
  await user.save();

  // TODO: Send notification to user about status change
  // await sendStatusChangeNotification(user, status, reason);

  return ApiResponse.success(res, 200, `User status updated to ${status}`, { user });
});

/**
 * Get user statistics (Admin only)
 * GET /api/v1/users/statistics
 */
export const getUserStatistics = catchAsync(async (req, res) => {
  const stats = await User.aggregate([
    {
      $facet: {
        totalByRole: [
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ],
        totalByStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        verificationStats: [
          {
            $group: {
              _id: null,
              emailVerified: {
                $sum: { $cond: ['$verification.emailVerified', 1, 0] }
              },
              phoneVerified: {
                $sum: { $cond: ['$verification.phoneVerified', 1, 0] }
              },
              identityVerified: {
                $sum: { $cond: ['$verification.identityVerified', 1, 0] }
              }
            }
          }
        ],
        recentUsers: [
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          {
            $project: {
              email: 1,
              role: 1,
              'profile.firstName': 1,
              'profile.lastName': 1,
              createdAt: 1
            }
          }
        ],
        averageCreditScore: [
          {
            $group: {
              _id: null,
              avgCreditScore: { $avg: '$financialProfile.creditScore' }
            }
          }
        ]
      }
    }
  ]);

  return ApiResponse.success(res, 200, 'User statistics retrieved successfully', {
    statistics: stats[0]
  });
});

/**
 * Search users
 * GET /api/v1/users/search
 */
export const searchUsers = catchAsync(async (req, res) => {
  const { q, role, status, page = 1, limit = 20 } = req.query;

  if (!q) {
    return ApiResponse.error(res, 400, 'Search query is required');
  }

  // Build search filter
  const filter = {
    $or: [
      { email: { $regex: q, $options: 'i' } },
      { 'profile.firstName': { $regex: q, $options: 'i' } },
      { 'profile.lastName': { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } }
    ]
  };

  if (role) filter.role = role;
  if (status) filter.status = status;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute search
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('email phone role profile.firstName profile.lastName profile.avatar status createdAt')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    User.countDocuments(filter)
  ]);

  return ApiResponse.paginated(res, 200, 'Search results', {
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

export default {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadDocument,
  verifyDocument,
  deleteDocument,
  updateUserStatus,
  getUserStatistics,
  searchUsers
};
