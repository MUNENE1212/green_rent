/**
 * Property Routes
 * Handles property CRUD, search, and media management
 */

import express from 'express';
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertiesByLandlord,
  uploadPropertyMedia,
  setPrimaryImage,
  searchProperties,
  toggleFeatured,
  verifyProperty,
  getPendingProperties,
  approveProperty,
  rejectProperty,
  requestReview
} from '../controllers/property.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Public routes
 */

/**
 * @route   GET /api/v1/properties/search
 * @desc    Search properties by name, location, or description
 * @access  Public
 * @query   { q: string, page?: number, limit?: number }
 */
router.get('/search', searchProperties);

/**
 * @route   GET /api/v1/properties
 * @desc    Get all properties with filtering and geospatial search
 * @access  Public
 * @query   { propertyType?, city?, county?, minPrice?, maxPrice?, amenities?, featured?, verified?, lat?, lng?, radius?, page?, limit? }
 */
router.get('/', getAllProperties);

/**
 * @route   GET /api/v1/properties/:id
 * @desc    Get property by ID with units
 * @access  Public
 */
router.get('/:id', getPropertyById);

/**
 * Protected routes (require authentication)
 */
router.use(protect);

/**
 * @route   GET /api/v1/properties/landlord/:landlordId
 * @desc    Get all properties by landlord
 * @access  Private (Own properties or Admin)
 */
router.get('/landlord/:landlordId', getPropertiesByLandlord);

/**
 * @route   POST /api/v1/properties
 * @desc    Create new property
 * @access  Private (Landlord, Admin)
 * @body    { name, description, propertyType, location, amenities, utilities, media, managementDetails, policies }
 */
router.post('/', authorize('landlord', 'admin'), createProperty);

/**
 * @route   PUT /api/v1/properties/:id
 * @desc    Update property
 * @access  Private (Own property or Admin)
 * @body    { name?, description?, propertyType?, location?, amenities?, utilities?, media?, managementDetails?, policies? }
 */
router.put('/:id', updateProperty);

/**
 * @route   DELETE /api/v1/properties/:id
 * @desc    Delete property (soft delete)
 * @access  Private (Own property or Admin)
 */
router.delete('/:id', deleteProperty);

/**
 * @route   POST /api/v1/properties/:id/media
 * @desc    Upload property media (photo, video, 360 tour, floor plan)
 * @access  Private (Own property or Admin)
 * @body    { type: string, url: string, caption?: string, isPrimary?: boolean }
 */
router.post('/:id/media', uploadPropertyMedia);

/**
 * @route   PUT /api/v1/properties/:id/media/primary
 * @desc    Set primary property image
 * @access  Private (Own property or Admin)
 * @body    { imageId: string }
 */
router.put('/:id/media/primary', setPrimaryImage);

/**
 * @route   PUT /api/v1/properties/:id/featured
 * @desc    Toggle property featured status
 * @access  Private (Own property or Admin)
 */
router.put('/:id/featured', toggleFeatured);

/**
 * @route   PUT /api/v1/properties/:id/verify
 * @desc    Verify property
 * @access  Private (Admin only)
 */
router.put('/:id/verify', authorize('admin'), verifyProperty);

/**
 * Admin verification routes
 */

/**
 * @route   GET /api/v1/properties/admin/pending
 * @desc    Get all pending properties awaiting verification
 * @access  Private (Admin only)
 * @query   { page?: number, limit?: number }
 */
router.get('/admin/pending', authorize('admin'), getPendingProperties);

/**
 * @route   PUT /api/v1/properties/:id/approve
 * @desc    Approve a property
 * @access  Private (Admin only)
 * @body    { notes?: string }
 */
router.put('/:id/approve', authorize('admin'), approveProperty);

/**
 * @route   PUT /api/v1/properties/:id/reject
 * @desc    Reject a property
 * @access  Private (Admin only)
 * @body    { reason: string, notes?: string }
 */
router.put('/:id/reject', authorize('admin'), rejectProperty);

/**
 * @route   PUT /api/v1/properties/:id/review
 * @desc    Request more information from landlord
 * @access  Private (Admin only)
 * @body    { notes: string }
 */
router.put('/:id/review', authorize('admin'), requestReview);

export default router;
