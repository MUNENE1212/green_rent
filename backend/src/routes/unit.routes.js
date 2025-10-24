/**
 * Unit Routes
 * Handles unit CRUD, availability, affordability, and media
 */

import express from 'express';
import {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  getAffordableUnits,
  getUnitsWithVirtualTours,
  reserveUnit,
  occupyUnit,
  vacateUnit,
  uploadUnitMedia
} from '../controllers/unit.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Public routes
 */

/**
 * @route   GET /api/v1/units/affordable
 * @desc    Find affordable units based on daily budget
 * @access  Public
 * @query   { maxDailyBudget: number, city?: string, county?: string, unitType?: string, page?: number, limit?: number }
 */
router.get('/affordable', getAffordableUnits);

/**
 * @route   GET /api/v1/units/virtual-tours
 * @desc    Get units with comprehensive virtual tours (80%+ media completeness)
 * @access  Public
 * @query   { page?: number, limit?: number }
 */
router.get('/virtual-tours', getUnitsWithVirtualTours);

/**
 * @route   GET /api/v1/units
 * @desc    Get all units with filtering
 * @access  Public
 * @query   { propertyId?, unitType?, availabilityStatus?, minPrice?, maxPrice?, bedrooms?, bathrooms?, furnished?, page?, limit? }
 */
router.get('/', getAllUnits);

/**
 * @route   GET /api/v1/units/:id
 * @desc    Get unit by ID with affordability breakdown
 * @access  Public
 */
router.get('/:id', getUnitById);

/**
 * Protected routes (require authentication)
 */
router.use(protect);

/**
 * @route   POST /api/v1/units
 * @desc    Create new unit
 * @access  Private (Landlord of property, Admin)
 * @body    { propertyId, unitNumber, unitType, floor, size, bedrooms, bathrooms, features, pricing, targetTenant, media, description }
 */
router.post('/', authorize('landlord', 'admin'), createUnit);

/**
 * @route   PUT /api/v1/units/:id
 * @desc    Update unit
 * @access  Private (Landlord of property, Admin)
 * @body    { unitNumber?, unitType?, floor?, size?, bedrooms?, bathrooms?, features?, pricing?, targetTenant?, media?, description? }
 */
router.put('/:id', updateUnit);

/**
 * @route   DELETE /api/v1/units/:id
 * @desc    Delete unit (cannot delete occupied units)
 * @access  Private (Landlord of property, Admin)
 */
router.delete('/:id', deleteUnit);

/**
 * @route   POST /api/v1/units/:id/reserve
 * @desc    Reserve unit for tenant
 * @access  Private (Tenant)
 */
router.post('/:id/reserve', authorize('tenant'), reserveUnit);

/**
 * @route   POST /api/v1/units/:id/occupy
 * @desc    Mark unit as occupied with tenant and lease
 * @access  Private (Landlord of property, Admin)
 * @body    { tenantId: string, leaseId: string }
 */
router.post('/:id/occupy', authorize('landlord', 'admin'), occupyUnit);

/**
 * @route   POST /api/v1/units/:id/vacate
 * @desc    Mark unit as vacated and available
 * @access  Private (Landlord of property, Admin)
 */
router.post('/:id/vacate', authorize('landlord', 'admin'), vacateUnit);

/**
 * @route   POST /api/v1/units/:id/media
 * @desc    Upload unit media (photo, video, 360 tour)
 * @access  Private (Landlord of property, Admin)
 * @body    { type: string, url: string, caption?: string }
 */
router.post('/:id/media', uploadUnitMedia);

export default router;
