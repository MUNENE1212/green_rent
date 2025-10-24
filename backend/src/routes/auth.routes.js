/**
 * Authentication Routes
 * Handles all authentication-related endpoints
 */

import express from 'express';
import {
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
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user (tenant or landlord)
 * @access  Public
 * @body    { email, password, phone, role, profile: { firstName, lastName } }
 */
router.post('/register', register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and get JWT tokens
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', login);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify email address with token
 * @access  Public
 * @params  token - Email verification token
 */
router.get('/verify-email/:token', verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 * @body    { email }
 */
router.post('/resend-verification', resendVerificationEmail);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 * @params  token - Password reset token
 * @body    { password, confirmPassword }
 */
router.post('/reset-password/:token', resetPassword);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh', refreshAccessToken);

// Protected routes (require authentication)
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 * @body    { refreshToken }
 */
router.post('/logout', protect, logout);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 * @body    { currentPassword, newPassword, confirmNewPassword }
 */
router.post('/change-password', protect, changePassword);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

export default router;
