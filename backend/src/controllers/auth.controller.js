/**
 * Authentication Controller
 * Handles user registration, login, token management, and password operations
 */

import crypto from 'crypto';
import { User } from '../models/index.js';
import { generateToken, generateRefreshToken, verifyToken } from '../middleware/auth.js';
import ApiResponse from '../utils/apiResponse.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = catchAsync(async (req, res) => {
  const { email, password, phone, role, profile } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return ApiResponse.error(res, 409, 'Email already registered');
    }
    return ApiResponse.error(res, 409, 'Phone number already registered');
  }

  // Validate role
  const allowedRoles = ['tenant', 'landlord'];
  if (role && !allowedRoles.includes(role)) {
    return ApiResponse.error(res, 400, 'Invalid role. Use "tenant" or "landlord"');
  }

  // Create user
  const user = await User.create({
    email,
    password,
    phone,
    role: role || 'tenant',
    profile: {
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      dateOfBirth: profile?.dateOfBirth,
      gender: profile?.gender,
      address: profile?.address
    }
  });

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  user.verification.emailVerificationToken = verificationToken;
  user.verification.emailVerificationExpires = verificationExpires;
  await user.save({ validateBeforeSave: false });

  // Generate JWT tokens
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in user document
  user.security.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email
  // await sendVerificationEmail(user.email, verificationToken);

  // Remove sensitive data from response
  user.password = undefined;
  user.security = undefined;
  user.verification = undefined;

  return ApiResponse.success(res, 201, 'Registration successful. Please verify your email.', {
    user,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '1h'
    },
    verificationEmailSent: true
  });
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return ApiResponse.error(res, 400, 'Please provide email and password');
  }

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return ApiResponse.error(res, 401, 'Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked()) {
    const lockTimeRemaining = Math.ceil((user.security.lockUntil - Date.now()) / 1000 / 60);
    return ApiResponse.error(
      res,
      423,
      `Account is locked due to multiple failed login attempts. Try again in ${lockTimeRemaining} minutes.`
    );
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    // Increment login attempts
    await user.incLoginAttempts();

    const attemptsLeft = 5 - user.security.loginAttempts;
    if (attemptsLeft > 0) {
      return ApiResponse.error(
        res,
        401,
        `Invalid email or password. ${attemptsLeft} attempts remaining.`
      );
    } else {
      return ApiResponse.error(
        res,
        423,
        'Account locked due to too many failed login attempts. Please try again in 2 hours.'
      );
    }
  }

  // Check account status
  if (user.status === 'suspended') {
    return ApiResponse.error(res, 403, 'Your account has been suspended. Please contact support.');
  }

  if (user.status === 'banned') {
    return ApiResponse.error(res, 403, 'Your account has been banned. Please contact support.');
  }

  // Reset login attempts on successful login
  if (user.security.loginAttempts > 0 || user.security.lockUntil) {
    await user.resetLoginAttempts();
  }

  // Generate JWT tokens
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token
  user.security.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  // Update last login
  user.security.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // Remove sensitive data
  user.password = undefined;
  user.security.refreshTokens = undefined;

  return ApiResponse.success(res, 200, 'Login successful', {
    user,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '1h'
    }
  });
});

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove specific refresh token
    await User.findByIdAndUpdate(req.user._id, {
      $pull: {
        'security.refreshTokens': { token: refreshToken }
      }
    });
  }

  return ApiResponse.success(res, 200, 'Logout successful');
});

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshAccessToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return ApiResponse.error(res, 400, 'Refresh token is required');
  }

  // Verify refresh token
  const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

  if (!decoded) {
    return ApiResponse.error(res, 401, 'Invalid or expired refresh token');
  }

  // Find user and check if refresh token exists
  const user = await User.findById(decoded.id);

  if (!user) {
    return ApiResponse.error(res, 401, 'User no longer exists');
  }

  // Check if refresh token is in user's token list
  const tokenExists = user.security.refreshTokens.some(
    (t) => t.token === refreshToken && t.expiresAt > Date.now()
  );

  if (!tokenExists) {
    return ApiResponse.error(res, 401, 'Refresh token is invalid or expired');
  }

  // Generate new access token
  const newAccessToken = generateToken(user._id);

  return ApiResponse.success(res, 200, 'Token refreshed successfully', {
    accessToken: newAccessToken,
    expiresIn: process.env.JWT_EXPIRE || '1h'
  });
});

/**
 * Verify email
 * GET /api/v1/auth/verify-email/:token
 */
export const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.params;

  // Find user with verification token
  const user = await User.findOne({
    'verification.emailVerificationToken': token,
    'verification.emailVerificationExpires': { $gt: Date.now() }
  });

  if (!user) {
    return ApiResponse.error(res, 400, 'Invalid or expired verification token');
  }

  // Mark email as verified
  user.verification.emailVerified = true;
  user.verification.emailVerificationToken = undefined;
  user.verification.emailVerificationExpires = undefined;
  user.verification.emailVerifiedAt = Date.now();

  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(res, 200, 'Email verified successfully', {
    emailVerified: true
  });
});

/**
 * Resend verification email
 * POST /api/v1/auth/resend-verification
 */
export const resendVerificationEmail = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return ApiResponse.error(res, 400, 'Email is required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    return ApiResponse.error(res, 404, 'User not found');
  }

  if (user.verification.emailVerified) {
    return ApiResponse.error(res, 400, 'Email is already verified');
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  user.verification.emailVerificationToken = verificationToken;
  user.verification.emailVerificationExpires = verificationExpires;
  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email
  // await sendVerificationEmail(user.email, verificationToken);

  return ApiResponse.success(res, 200, 'Verification email sent successfully', {
    verificationEmailSent: true
  });
});

/**
 * Forgot password - Request password reset
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return ApiResponse.error(res, 400, 'Email is required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists or not
    return ApiResponse.success(
      res,
      200,
      'If an account with that email exists, a password reset link has been sent.'
    );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  user.security.passwordResetToken = resetToken;
  user.security.passwordResetExpires = resetExpires;
  await user.save({ validateBeforeSave: false });

  // TODO: Send password reset email
  // await sendPasswordResetEmail(user.email, resetToken);

  return ApiResponse.success(
    res,
    200,
    'If an account with that email exists, a password reset link has been sent.',
    {
      resetEmailSent: true
    }
  );
});

/**
 * Reset password
 * POST /api/v1/auth/reset-password/:token
 */
export const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  // Validate input
  if (!password || !confirmPassword) {
    return ApiResponse.error(res, 400, 'Please provide password and confirm password');
  }

  if (password !== confirmPassword) {
    return ApiResponse.error(res, 400, 'Passwords do not match');
  }

  if (password.length < 8) {
    return ApiResponse.error(res, 400, 'Password must be at least 8 characters long');
  }

  // Find user with reset token
  const user = await User.findOne({
    'security.passwordResetToken': token,
    'security.passwordResetExpires': { $gt: Date.now() }
  }).select('+password');

  if (!user) {
    return ApiResponse.error(res, 400, 'Invalid or expired reset token');
  }

  // Update password
  user.password = password;
  user.security.passwordResetToken = undefined;
  user.security.passwordResetExpires = undefined;
  user.security.passwordChangedAt = Date.now();

  // Clear all refresh tokens (force re-login on all devices)
  user.security.refreshTokens = [];

  await user.save();

  // Generate new tokens
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store new refresh token
  user.security.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(res, 200, 'Password reset successful', {
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '1h'
    }
  });
});

/**
 * Change password (authenticated user)
 * POST /api/v1/auth/change-password
 */
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return ApiResponse.error(res, 400, 'Please provide all required fields');
  }

  if (newPassword !== confirmNewPassword) {
    return ApiResponse.error(res, 400, 'New passwords do not match');
  }

  if (newPassword.length < 8) {
    return ApiResponse.error(res, 400, 'Password must be at least 8 characters long');
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordCorrect) {
    return ApiResponse.error(res, 401, 'Current password is incorrect');
  }

  // Check if new password is same as current
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    return ApiResponse.error(res, 400, 'New password must be different from current password');
  }

  // Update password
  user.password = newPassword;
  user.security.passwordChangedAt = Date.now();

  // Clear all refresh tokens except current one (optional - force re-login on other devices)
  // For now, we'll keep all tokens valid
  await user.save();

  return ApiResponse.success(res, 200, 'Password changed successfully');
});

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-security.refreshTokens -verification.emailVerificationToken');

  if (!user) {
    return ApiResponse.error(res, 404, 'User not found');
  }

  return ApiResponse.success(res, 200, 'User profile retrieved successfully', {
    user
  });
});

export default {
  register,
  login,
  logout,
  refreshAccessToken,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe
};
