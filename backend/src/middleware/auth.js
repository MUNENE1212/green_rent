/**
 * Authentication Middleware
 * Handles JWT verification and role-based authorization
 */

import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/apiResponse.js';

/**
 * Generate JWT access token
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

/**
 * Protect routes - Require authentication
 */
export const protect = catchAsync(async (req, res, next) => {
  // 1. Get token from header
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.unauthorized(res, 'You are not logged in. Please log in to access this resource.');
  }

  // 2. Verify token
  const decoded = verifyToken(token);

  if (!decoded) {
    return ApiResponse.unauthorized(res, 'Invalid or expired token. Please log in again.');
  }

  // 3. Check if user still exists
  const user = await User.findById(decoded.id).select('+password');

  if (!user) {
    return ApiResponse.unauthorized(res, 'The user belonging to this token no longer exists.');
  }

  // 4. Check if user is active
  if (user.status !== 'active') {
    return ApiResponse.forbidden(res, `Account is ${user.status}. Please contact support.`);
  }

  // 5. Check if account is locked
  if (user.isLocked()) {
    return ApiResponse.forbidden(res, 'Account is temporarily locked due to multiple failed login attempts.');
  }

  // 6. Check if user changed password after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return ApiResponse.unauthorized(res, 'Password was recently changed. Please log in again.');
  }

  // 7. Grant access to protected route
  req.user = user;
  next();
});

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'landlord')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Access denied. This resource is only accessible to ${roles.join(', ')} users.`
      );
    }
    next();
  };
};

/**
 * Optional authentication - Attach user if token exists
 * Doesn't block if no token
 */
export const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    const decoded = verifyToken(token);

    if (decoded) {
      const user = await User.findById(decoded.id);
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
  }

  next();
});

/**
 * Check if user owns the resource
 * For routes like /users/:id, /properties/:id (owned by landlord)
 */
export const checkOwnership = (resourceUserIdField = 'userId') => {
  return catchAsync(async (req, res, next) => {
    // Admin can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    // Get resource ID from params or body
    const resourceId = req.params.id;

    if (!resourceId) {
      return next();
    }

    // This will be enhanced in controllers to check actual ownership
    // For now, just pass through
    next();
  });
};

/**
 * Verify email token
 */
export const verifyEmailToken = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return ApiResponse.error(res, 400, 'Verification token is required');
  }

  // Find user with this verification token
  const user = await User.findOne({
    'verification.emailVerificationToken': token,
    'verification.emailVerificationExpires': { $gt: Date.now() }
  });

  if (!user) {
    return ApiResponse.error(res, 400, 'Invalid or expired verification token');
  }

  req.user = user;
  next();
});

/**
 * Verify password reset token
 */
export const verifyResetToken = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return ApiResponse.error(res, 400, 'Reset token is required');
  }

  // Find user with this reset token
  const user = await User.findOne({
    'security.passwordResetToken': token,
    'security.passwordResetExpires': { $gt: Date.now() }
  }).select('+password');

  if (!user) {
    return ApiResponse.error(res, 400, 'Invalid or expired reset token');
  }

  req.user = user;
  next();
});

export default {
  protect,
  authorize,
  optionalAuth,
  checkOwnership,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyEmailToken,
  verifyResetToken
};
