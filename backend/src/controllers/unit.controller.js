/**
 * Unit Controller
 * Handles unit CRUD, availability, and affordability operations
 */

import { Unit, Property, Lease } from '../models/index.js';
import ApiResponse from '../utils/apiResponse.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * Create new unit
 * POST /api/v1/units
 */
export const createUnit = catchAsync(async (req, res) => {
  const {
    propertyId,
    unitNumber,
    unitType,
    floor,
    size,
    bedrooms,
    bathrooms,
    features,
    pricing,
    targetTenant,
    media,
    description
  } = req.body;

  // Verify property exists and user is the landlord
  const property = await Property.findById(propertyId);

  if (!property) {
    return ApiResponse.notFound(res, 'Property not found');
  }

  if (req.user.role !== 'admin' && property.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only add units to your own properties');
  }

  // Create unit
  const unit = await Unit.create({
    propertyId,
    unitNumber,
    unitType,
    floor,
    size,
    bedrooms,
    bathrooms,
    features,
    pricing,
    targetTenant,
    media,
    description
  });

  // Update property occupancy
  await property.updateOccupancyRate();

  return ApiResponse.success(res, 201, 'Unit created successfully', { unit });
});

/**
 * Get all units with filtering
 * GET /api/v1/units
 */
export const getAllUnits = catchAsync(async (req, res) => {
  const {
    propertyId,
    unitType,
    availabilityStatus,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    furnished,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build filter
  const filter = {};

  if (propertyId) filter.propertyId = propertyId;
  if (unitType) filter.unitType = unitType;
  if (availabilityStatus) filter.availabilityStatus = availabilityStatus;
  if (minPrice) filter.currentPrice = { ...filter.currentPrice, $gte: Number(minPrice) };
  if (maxPrice) filter.currentPrice = { ...filter.currentPrice, $lte: Number(maxPrice) };
  if (bedrooms) filter.bedrooms = Number(bedrooms);
  if (bathrooms) filter.bathrooms = Number(bathrooms);
  if (furnished !== undefined) filter['features.furnished'] = furnished === 'true';

  // Calculate pagination
  const skip = (page - 1) * limit;
  const sortOrder = order === 'desc' ? -1 : 1;

  // Execute query
  const [units, total] = await Promise.all([
    Unit.find(filter)
      .populate('propertyId', 'name location.address.city location.address.county landlordId')
      .populate('currentTenant', 'profile.firstName profile.lastName email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    Unit.countDocuments(filter)
  ]);

  return ApiResponse.paginated(res, 200, 'Units retrieved successfully', {
    units,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get unit by ID
 * GET /api/v1/units/:id
 */
export const getUnitById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const unit = await Unit.findById(id)
    .populate('propertyId')
    .populate('currentTenant', 'profile.firstName profile.lastName email phone')
    .populate('currentLease');

  if (!unit) {
    return ApiResponse.notFound(res, 'Unit not found');
  }

  // Increment view count
  await unit.incrementViewCount();

  // Get affordability breakdown
  const affordability = unit.getAffordabilityBreakdown();

  return ApiResponse.success(res, 200, 'Unit retrieved successfully', {
    unit,
    affordability
  });
});

/**
 * Update unit
 * PUT /api/v1/units/:id
 */
export const updateUnit = catchAsync(async (req, res) => {
  const { id } = req.params;

  const unit = await Unit.findById(id).populate('propertyId');

  if (!unit) {
    return ApiResponse.notFound(res, 'Unit not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && unit.propertyId.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only update units in your own properties');
  }

  // Fields that can be updated
  const allowedFields = [
    'unitNumber',
    'unitType',
    'floor',
    'size',
    'bedrooms',
    'bathrooms',
    'features',
    'pricing',
    'targetTenant',
    'media',
    'description'
  ];

  // Update only allowed fields
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      unit[field] = req.body[field];
    }
  });

  await unit.save();

  // Update property occupancy
  const property = await Property.findById(unit.propertyId);
  if (property) {
    await property.updateOccupancyRate();
  }

  return ApiResponse.success(res, 200, 'Unit updated successfully', { unit });
});

/**
 * Delete unit
 * DELETE /api/v1/units/:id
 */
export const deleteUnit = catchAsync(async (req, res) => {
  const { id } = req.params;

  const unit = await Unit.findById(id).populate('propertyId');

  if (!unit) {
    return ApiResponse.notFound(res, 'Unit not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && unit.propertyId.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only delete units in your own properties');
  }

  // Check if unit is occupied
  if (unit.availabilityStatus === 'occupied') {
    return ApiResponse.error(res, 400, 'Cannot delete occupied unit');
  }

  await unit.deleteOne();

  // Update property occupancy
  const property = await Property.findById(unit.propertyId);
  if (property) {
    await property.updateOccupancyRate();
  }

  return ApiResponse.success(res, 200, 'Unit deleted successfully');
});

/**
 * Find affordable units
 * GET /api/v1/units/affordable
 */
export const getAffordableUnits = catchAsync(async (req, res) => {
  const { maxDailyBudget, city, county, unitType, page = 1, limit = 20 } = req.query;

  if (!maxDailyBudget) {
    return ApiResponse.error(res, 400, 'Maximum daily budget is required');
  }

  // Build additional filters
  const additionalFilters = { availabilityStatus: 'available' };
  if (unitType) additionalFilters.unitType = unitType;

  // Find affordable units
  const skip = (page - 1) * limit;

  let units = await Unit.findAffordableUnits(Number(maxDailyBudget), additionalFilters)
    .populate('propertyId', 'name location.address amenities')
    .skip(skip)
    .limit(Number(limit));

  // Filter by location if provided
  if (city || county) {
    units = units.filter(unit => {
      const address = unit.propertyId?.location?.address;
      if (!address) return false;

      if (city && !address.city.toLowerCase().includes(city.toLowerCase())) {
        return false;
      }
      if (county && !address.county.toLowerCase().includes(county.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  const total = units.length;

  return ApiResponse.paginated(res, 200, 'Affordable units retrieved successfully', {
    units,
    maxDailyBudget: Number(maxDailyBudget),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get units with virtual tours
 * GET /api/v1/units/virtual-tours
 */
export const getUnitsWithVirtualTours = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  const [units, total] = await Promise.all([
    Unit.findUnitsWithVirtualTours()
      .populate('propertyId', 'name location.address')
      .skip(skip)
      .limit(Number(limit)),
    Unit.countDocuments({
      availabilityStatus: 'available',
      'quality.mediaCompleteness': { $gte: 80 }
    })
  ]);

  return ApiResponse.paginated(res, 200, 'Units with virtual tours retrieved successfully', {
    units,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Reserve unit
 * POST /api/v1/units/:id/reserve
 */
export const reserveUnit = catchAsync(async (req, res) => {
  const { id } = req.params;

  const unit = await Unit.findById(id);

  if (!unit) {
    return ApiResponse.notFound(res, 'Unit not found');
  }

  if (!unit.isAvailable()) {
    return ApiResponse.error(res, 400, 'Unit is not available for reservation');
  }

  // Reserve unit
  await unit.reserve(req.user._id);

  return ApiResponse.success(res, 200, 'Unit reserved successfully', { unit });
});

/**
 * Occupy unit
 * POST /api/v1/units/:id/occupy
 */
export const occupyUnit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { tenantId, leaseId } = req.body;

  if (!tenantId || !leaseId) {
    return ApiResponse.error(res, 400, 'Tenant ID and Lease ID are required');
  }

  const unit = await Unit.findById(id).populate('propertyId');

  if (!unit) {
    return ApiResponse.notFound(res, 'Unit not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && unit.propertyId.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'Only the landlord can mark unit as occupied');
  }

  // Verify lease exists
  const lease = await Lease.findById(leaseId);
  if (!lease) {
    return ApiResponse.notFound(res, 'Lease not found');
  }

  // Occupy unit
  await unit.occupy(tenantId, leaseId);

  // Update property occupancy
  const property = await Property.findById(unit.propertyId);
  if (property) {
    await property.updateOccupancyRate();
  }

  return ApiResponse.success(res, 200, 'Unit occupied successfully', { unit });
});

/**
 * Vacate unit
 * POST /api/v1/units/:id/vacate
 */
export const vacateUnit = catchAsync(async (req, res) => {
  const { id } = req.params;

  const unit = await Unit.findById(id).populate('propertyId');

  if (!unit) {
    return ApiResponse.notFound(res, 'Unit not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && unit.propertyId.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'Only the landlord can mark unit as vacated');
  }

  // Vacate unit
  await unit.vacate();

  // Update property occupancy
  const property = await Property.findById(unit.propertyId);
  if (property) {
    await property.updateOccupancyRate();
  }

  return ApiResponse.success(res, 200, 'Unit vacated successfully', { unit });
});

/**
 * Upload unit media
 * POST /api/v1/units/:id/media
 */
export const uploadUnitMedia = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { type, url, caption } = req.body;

  if (!type || !url) {
    return ApiResponse.error(res, 400, 'Media type and URL are required');
  }

  const unit = await Unit.findById(id).populate('propertyId');

  if (!unit) {
    return ApiResponse.notFound(res, 'Unit not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && unit.propertyId.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only upload media to your own units');
  }

  // Add media based on type
  const mediaItem = { url, caption, uploadedAt: Date.now() };

  switch (type) {
    case 'photo':
      unit.media.photos.push(mediaItem);
      break;
    case 'video':
      unit.media.videos.push(mediaItem);
      break;
    case 'tour360':
      unit.media.tours360.push(mediaItem);
      break;
    default:
      return ApiResponse.error(res, 400, 'Invalid media type (photo, video, tour360)');
  }

  await unit.save();

  return ApiResponse.success(res, 201, 'Media uploaded successfully', {
    media: unit.media
  });
});

export default {
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
};
