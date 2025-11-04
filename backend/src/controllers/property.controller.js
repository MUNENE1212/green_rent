/**
 * Property Controller
 * Handles property CRUD, search, and management operations
 */

import { Property, Unit, User } from '../models/index.js';
import ApiResponse from '../utils/apiResponse.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * Helper: Transform simplified utility data to full schema format
 */
const transformUtilities = (utilities) => {
  if (!utilities) return {};

  const transformed = {};

  // Transform water
  if (utilities.water) {
    if (typeof utilities.water === 'string') {
      transformed.water = {
        source: 'municipal',
        meterType: 'individual',
        included: utilities.water === 'included',
        ratePerUnit: utilities.water === 'tenant' ? 50 : undefined
      };
    } else {
      transformed.water = utilities.water;
    }
  }

  // Transform electricity
  if (utilities.electricity) {
    if (typeof utilities.electricity === 'string') {
      transformed.electricity = {
        provider: 'Kenya Power',
        meterType: 'prepaid',
        included: utilities.electricity === 'included',
        ratePerUnit: utilities.electricity === 'tenant' ? 20 : undefined
      };
    } else {
      transformed.electricity = utilities.electricity;
    }
  }

  // Transform internet
  if (utilities.internet) {
    if (typeof utilities.internet === 'string') {
      transformed.internet = {
        available: utilities.internet !== 'none',
        included: utilities.internet === 'included',
        provider: utilities.internet === 'tenant' ? '' : undefined,
        speed: ''
      };
    } else {
      transformed.internet = utilities.internet;
    }
  }

  // Transform gas
  if (utilities.gas) {
    if (typeof utilities.gas === 'string') {
      transformed.gas = {
        available: utilities.gas !== 'none',
        type: 'cylinder',
        included: utilities.gas === 'included'
      };
    } else {
      transformed.gas = utilities.gas;
    }
  }

  return transformed;
};

/**
 * Helper: Normalize property data from simplified frontend format
 */
const normalizePropertyData = (data, landlordId) => {
  // Handle location data
  const locationData = data.location || {};
  const addressData = locationData.address || data.address || {};

  const normalized = {
    landlordId,
    basicInfo: {
      name: data.name || data.basicInfo?.name,
      description: data.description || data.basicInfo?.description,
      propertyType: data.propertyType || data.basicInfo?.propertyType,
      totalUnits: data.totalUnits || data.basicInfo?.totalUnits || 1,
      totalFloors: data.totalFloors || data.basicInfo?.totalFloors || 1,
      parkingSpaces: data.parkingSpaces || data.basicInfo?.parkingSpaces || 0,
      yearBuilt: data.yearBuilt || data.basicInfo?.yearBuilt
    },
    location: {
      address: {
        street: addressData.street || data.street || '',
        area: addressData.area || data.area || '',
        city: addressData.city || data.city || 'Nairobi',
        county: addressData.county || data.county || 'Nairobi',
        postalCode: addressData.postalCode || data.postalCode,
        landmark: addressData.landmark || data.landmark
      },
      coordinates: locationData.coordinates || {
        type: 'Point',
        coordinates: [36.8219, -1.2921] // Default: Nairobi
      },
      accessibility: locationData.accessibility || {}
    },
    amenities: data.amenities || {},
    utilities: transformUtilities(data.utilities),
    media: data.media || [],
    virtualTour: data.virtualTour || {},
    pricing: {
      basePrice: data.basePrice || data.pricing?.basePrice || 0,
      priceRange: {
        min: data.priceRange?.min || data.pricing?.priceRange?.min || data.basePrice || 0,
        max: data.priceRange?.max || data.pricing?.priceRange?.max || data.basePrice || 0
      },
      deposit: {
        amount: data.deposit || data.pricing?.deposit?.amount || (data.basePrice || 0),
        refundable: data.depositRefundable !== false
      },
      otherFees: data.otherFees || data.pricing?.otherFees || []
    },
    occupancy: {
      totalUnits: data.totalUnits || data.basicInfo?.totalUnits || data.occupancy?.totalUnits || 1,
      occupiedUnits: 0,
      availableUnits: data.totalUnits || data.basicInfo?.totalUnits || 1,
      maintenanceUnits: 0,
      occupancyRate: 0
    },
    management: data.management || {},
    settings: data.settings || {},
    performance: {
      averageRating: 0,
      totalReviews: 0,
      viewCount: 0,
      inquiryCount: 0,
      conversionRate: 0
    },
    status: data.status || 'pending_approval',
    featured: data.featured || false,
    verifiedProperty: false
  };

  return normalized;
};

/**
 * Create new property
 * POST /api/v1/properties
 */
export const createProperty = catchAsync(async (req, res) => {
  // Validate landlord role
  if (req.user.role !== 'landlord' && req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, 'Only landlords can create properties');
  }

  // Normalize and transform property data
  const propertyData = normalizePropertyData(req.body, req.user._id);

  // Override coordinates if explicitly provided in correct format
  if (req.body.location?.coordinates?.coordinates) {
    if (req.body.location.coordinates.coordinates.length !== 2) {
      return ApiResponse.error(res, 400, 'Valid coordinates [longitude, latitude] are required');
    }
    propertyData.location.coordinates = {
      type: 'Point',
      coordinates: req.body.location.coordinates.coordinates
    };
  }

  // Create property
  const property = await Property.create(propertyData);

  return ApiResponse.success(res, 201, 'Property created successfully', { property });
});

/**
 * Get all properties with filtering and search
 * GET /api/v1/properties
 */
export const getAllProperties = catchAsync(async (req, res) => {
  const {
    propertyType,
    city,
    county,
    minPrice,
    maxPrice,
    amenities,
    featured,
    verified,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc',
    // Geospatial search
    lat,
    lng,
    radius = 5 // kilometers
  } = req.query;

  // Build filter
  const filter = { status: 'active' };

  if (propertyType) filter.propertyType = propertyType;
  if (city) filter['location.address.city'] = new RegExp(city, 'i');
  if (county) filter['location.address.county'] = new RegExp(county, 'i');
  if (featured !== undefined) filter.featured = featured === 'true';
  if (verified !== undefined) filter.verified = verified === 'true';

  // Amenities filter
  if (amenities) {
    const amenitiesArray = amenities.split(',');
    filter.$or = [
      { 'amenities.security': { $in: amenitiesArray } },
      { 'amenities.utilities': { $in: amenitiesArray } },
      { 'amenities.facilities': { $in: amenitiesArray } },
      { 'amenities.services': { $in: amenitiesArray } }
    ];
  }

  // Geospatial search
  if (lat && lng) {
    filter['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const sortOrder = order === 'desc' ? -1 : 1;

  // Execute query
  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('landlordId', 'profile.firstName profile.lastName email phone')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    Property.countDocuments(filter)
  ]);

  // Update view counts
  properties.forEach(property => {
    property.incrementViewCount();
  });

  return ApiResponse.paginated(res, 200, 'Properties retrieved successfully', {
    properties,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get property by ID
 * GET /api/v1/properties/:id
 */
export const getPropertyById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id)
    .populate('landlordId', 'profile.firstName profile.lastName email phone profile.avatar');

  if (!property) {
    return ApiResponse.notFound(res, 'Property not found');
  }

  // Increment view count
  await property.incrementViewCount();

  // Get units for this property
  const units = await Unit.find({ propertyId: id });

  return ApiResponse.success(res, 200, 'Property retrieved successfully', {
    property,
    units
  });
});

/**
 * Update property
 * PUT /api/v1/properties/:id
 */
export const updateProperty = catchAsync(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id);

  if (!property) {
    return ApiResponse.notFound(res, 'Property not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && property.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only update your own properties');
  }

  // Fields that can be updated
  const allowedFields = [
    'name',
    'description',
    'propertyType',
    'location',
    'amenities',
    'utilities',
    'media',
    'managementDetails',
    'policies'
  ];

  // Update only allowed fields
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      property[field] = req.body[field];
    }
  });

  await property.save();

  return ApiResponse.success(res, 200, 'Property updated successfully', { property });
});

/**
 * Delete property
 * DELETE /api/v1/properties/:id
 */
export const deleteProperty = catchAsync(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id);

  if (!property) {
    return ApiResponse.notFound(res, 'Property not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && property.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only delete your own properties');
  }

  // Check if property has active units
  const activeUnits = await Unit.countDocuments({
    propertyId: id,
    availabilityStatus: 'occupied'
  });

  if (activeUnits > 0) {
    return ApiResponse.error(res, 400, 'Cannot delete property with occupied units');
  }

  // Soft delete
  property.status = 'inactive';
  await property.save();

  return ApiResponse.success(res, 200, 'Property deleted successfully');
});

/**
 * Get properties by landlord
 * GET /api/v1/properties/landlord/:landlordId
 */
export const getPropertiesByLandlord = catchAsync(async (req, res) => {
  const { landlordId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Check if user can access these properties
  if (req.user.role !== 'admin' && req.user._id.toString() !== landlordId) {
    return ApiResponse.forbidden(res, 'You can only view your own properties');
  }

  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    Property.find({ landlordId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Property.countDocuments({ landlordId })
  ]);

  return ApiResponse.paginated(res, 200, 'Landlord properties retrieved successfully', {
    properties,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Upload property media
 * POST /api/v1/properties/:id/media
 */
export const uploadPropertyMedia = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { type, url, caption, isPrimary } = req.body;

  if (!type || !url) {
    return ApiResponse.error(res, 400, 'Media type and URL are required');
  }

  const property = await Property.findById(id);

  if (!property) {
    return ApiResponse.notFound(res, 'Property not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && property.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only upload media to your own properties');
  }

  // Add media based on type
  const mediaItem = { url, caption, uploadedAt: Date.now() };

  switch (type) {
    case 'photo':
      property.media.photos.push(mediaItem);
      break;
    case 'video':
      property.media.videos.push(mediaItem);
      break;
    case 'tour360':
      property.media.tours360.push(mediaItem);
      break;
    case 'floorPlan':
      property.media.floorPlans.push(mediaItem);
      break;
    default:
      return ApiResponse.error(res, 400, 'Invalid media type');
  }

  await property.save();

  // Set as primary if requested
  if (isPrimary && type === 'photo' && property.media.photos.length > 0) {
    const lastPhotoId = property.media.photos[property.media.photos.length - 1]._id;
    await property.setPrimaryImage(lastPhotoId);
  }

  return ApiResponse.success(res, 201, 'Media uploaded successfully', {
    media: property.media
  });
});

/**
 * Set primary property image
 * PUT /api/v1/properties/:id/media/primary
 */
export const setPrimaryImage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { imageId } = req.body;

  if (!imageId) {
    return ApiResponse.error(res, 400, 'Image ID is required');
  }

  const property = await Property.findById(id);

  if (!property) {
    return ApiResponse.notFound(res, 'Property not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && property.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only modify your own properties');
  }

  await property.setPrimaryImage(imageId);

  return ApiResponse.success(res, 200, 'Primary image set successfully', {
    media: property.media
  });
});

/**
 * Search properties
 * GET /api/v1/properties/search
 */
export const searchProperties = catchAsync(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q) {
    return ApiResponse.error(res, 400, 'Search query is required');
  }

  const filter = {
    status: 'active',
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { 'location.address.city': { $regex: q, $options: 'i' } },
      { 'location.address.county': { $regex: q, $options: 'i' } },
      { 'location.address.area': { $regex: q, $options: 'i' } }
    ]
  };

  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('landlordId', 'profile.firstName profile.lastName')
      .skip(skip)
      .limit(Number(limit))
      .sort({ 'performance.viewCount': -1 }),
    Property.countDocuments(filter)
  ]);

  return ApiResponse.paginated(res, 200, 'Search results', {
    properties,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Toggle property featured status
 * PUT /api/v1/properties/:id/featured
 */
export const toggleFeatured = catchAsync(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id);

  if (!property) {
    return ApiResponse.notFound(res, 'Property not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && property.landlordId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only modify your own properties');
  }

  property.featured = !property.featured;
  await property.save();

  return ApiResponse.success(res, 200, `Property ${property.featured ? 'featured' : 'unfeatured'} successfully`, {
    property
  });
});

/**
 * Verify property (Admin only)
 * PUT /api/v1/properties/:id/verify
 */
export const verifyProperty = catchAsync(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id);

  if (!property) {
    return ApiResponse.notFound(res, 'Property not found');
  }

  property.verified = true;
  await property.save();

  return ApiResponse.success(res, 200, 'Property verified successfully', { property });
});

export default {
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
  verifyProperty
};
