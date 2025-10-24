/**
 * User Routes
 * Handles user profile management, documents, and admin operations
 */

import express from 'express';
import {
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
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users by name, email, or phone
 * @access  Private (Admin only)
 * @query   { q: string, role?: string, status?: string, page?: number, limit?: number }
 */
router.get('/search', authorize('admin'), searchUsers);

/**
 * @route   GET /api/v1/users/statistics
 * @desc    Get user statistics and analytics
 * @access  Private (Admin only)
 */
router.get('/statistics', authorize('admin'), getUserStatistics);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin only)
 * @query   { role?: string, status?: string, page?: number, limit?: number, sortBy?: string, order?: string }
 */
router.get('/', authorize('admin'), getAllUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Own profile or Admin)
 */
router.get('/:id', getUserById);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user profile
 * @access  Private (Own profile or Admin)
 * @body    { profile?: object, financialProfile?: object, preferences?: object }
 */
router.put('/:id', updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user account (soft delete)
 * @access  Private (Own account or Admin)
 */
router.delete('/:id', deleteUser);

/**
 * @route   POST /api/v1/users/:id/documents
 * @desc    Upload user document
 * @access  Private (Own profile or Admin)
 * @body    { type: string, name: string, url: string, expiryDate?: date }
 */
router.post('/:id/documents', uploadDocument);

/**
 * @route   PUT /api/v1/users/:id/documents/:documentId/verify
 * @desc    Verify user document
 * @access  Private (Admin only)
 */
router.put('/:id/documents/:documentId/verify', authorize('admin'), verifyDocument);

/**
 * @route   DELETE /api/v1/users/:id/documents/:documentId
 * @desc    Delete user document
 * @access  Private (Own document or Admin)
 */
router.delete('/:id/documents/:documentId', deleteDocument);

/**
 * @route   PUT /api/v1/users/:id/status
 * @desc    Update user status (active, suspended, banned, deleted)
 * @access  Private (Admin only)
 * @body    { status: string, reason?: string }
 */
router.put('/:id/status', authorize('admin'), updateUserStatus);

export default router;
