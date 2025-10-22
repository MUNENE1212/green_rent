import mongoose from 'mongoose';

const { Schema } = mongoose;

const unitSchema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },

  unitNumber: {
    type: String,
    required: [true, 'Unit number is required'],
    trim: true
  },

  unitType: {
    type: String,
    enum: [
      'single_room',
      'bedsitter',
      'studio',
      'one_bedroom',
      'two_bedroom',
      'three_bedroom',
      'four_bedroom_plus',
      'servant_quarter',
      'dsq'
    ],
    required: true
  },

  floor: {
    type: Number,
    default: 0
  },

  bedrooms: {
    type: Number,
    required: true,
    min: 0
  },

  bathrooms: {
    type: Number,
    required: true,
    min: 1
  },

  size: {
    type: Number, // square meters
    min: 0
  },

  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: 0
  },

  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },

  priceRange: {
    minimum: {
      type: Number,
      required: true,
      min: 0
    },
    maximum: {
      type: Number,
      required: true,
      min: 0
    }
  },

  // For affordability matching
  dailyEquivalent: {
    type: Number,
    default: 0
  },

  availabilityStatus: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance', 'under_offer'],
    default: 'available',
    index: true
  },

  availableFrom: {
    type: Date,
    default: Date.now
  },

  targetTenant: {
    type: String,
    enum: ['student', 'young_professional', 'family', 'low_income', 'any'],
    default: 'any'
  },

  features: [{
    type: String
  }],

  furnishing: {
    type: {
      type: String,
      enum: ['unfurnished', 'semi-furnished', 'fully-furnished'],
      default: 'unfurnished'
    },
    items: [String]
  },

  priceHistory: [{
    price: Number,
    reason: String,
    appliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  utilities: {
    waterMeterNumber: String,
    electricityMeterNumber: String,
    waterIncluded: {
      type: Boolean,
      default: false
    },
    electricityIncluded: {
      type: Boolean,
      default: false
    }
  },

  images: [{
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    type: {
      type: String,
      enum: ['photo', 'video', '360_view', 'floor_plan'],
      default: 'photo'
    },
    room: {
      type: String,
      enum: [
        'living_room',
        'master_bedroom',
        'bedroom_2',
        'bedroom_3',
        'bedroom_4',
        'kitchen',
        'bathroom',
        'bathroom_2',
        'balcony',
        'view',
        'exterior',
        'parking'
      ],
      required: true
    },
    order: {
      type: Number,
      default: 0
    },
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  virtualTour: {
    available: {
      type: Boolean,
      default: false
    },
    tourUrl: String,
    provider: {
      type: String,
      enum: ['matterport', 'kuula', 'custom', 'other']
    },
    views: {
      type: Number,
      default: 0
    }
  },

  videoWalkthrough: {
    available: {
      type: Boolean,
      default: false
    },
    videoUrl: String,
    duration: Number, // in seconds
    views: {
      type: Number,
      default: 0
    }
  },

  mediaCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  allowVirtualViewingOnly: {
    type: Boolean,
    default: false
  },

  currentTenant: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  currentLease: {
    type: Schema.Types.ObjectId,
    ref: 'Lease'
  },

  performance: {
    viewCount: {
      type: Number,
      default: 0
    },
    inquiryCount: {
      type: Number,
      default: 0
    },
    applicationCount: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
unitSchema.index({ propertyId: 1 });
unitSchema.index({ availabilityStatus: 1 });
unitSchema.index({ currentPrice: 1 });
unitSchema.index({ bedrooms: 1 });
unitSchema.index({ unitType: 1 });
unitSchema.index({ targetTenant: 1 });

// Compound indexes for common queries
unitSchema.index({ availabilityStatus: 1, currentPrice: 1 });
unitSchema.index({ propertyId: 1, availabilityStatus: 1 });

// Virtual for property details
unitSchema.virtual('property', {
  ref: 'Property',
  localField: 'propertyId',
  foreignField: '_id',
  justOne: true
});

// Calculate daily equivalent before saving
unitSchema.pre('save', function(next) {
  if (this.isModified('currentPrice')) {
    this.dailyEquivalent = Math.round(this.currentPrice / 30);
  }
  next();
});

// Update media completeness before saving
unitSchema.pre('save', function(next) {
  const requiredPhotos = 12;
  const photoCount = this.images.filter(img => img.type === 'photo').length;
  const hasVideo = this.videoWalkthrough.available;
  const has360Tour = this.virtualTour.available;

  let score = 0;
  score += Math.min((photoCount / requiredPhotos) * 60, 60); // Up to 60%
  score += hasVideo ? 20 : 0; // 20% for video
  score += has360Tour ? 20 : 0; // 20% for virtual tour

  this.mediaCompleteness = Math.round(score);

  // Auto-enable virtual viewing if media is comprehensive
  if (this.mediaCompleteness >= 80) {
    this.allowVirtualViewingOnly = true;
  }

  next();
});

// Method to check if unit is available
unitSchema.methods.isAvailable = function() {
  return this.availabilityStatus === 'available';
};

// Method to reserve unit
unitSchema.methods.reserve = async function(tenantId) {
  if (!this.isAvailable()) {
    throw new Error('Unit is not available');
  }

  this.availabilityStatus = 'reserved';
  return this.save();
};

// Method to occupy unit
unitSchema.methods.occupy = async function(tenantId, leaseId) {
  this.availabilityStatus = 'occupied';
  this.currentTenant = tenantId;
  this.currentLease = leaseId;
  return this.save();
};

// Method to vacate unit
unitSchema.methods.vacate = async function() {
  this.availabilityStatus = 'available';
  this.currentTenant = null;
  this.currentLease = null;
  this.availableFrom = Date.now();
  return this.save();
};

// Method to calculate affordability (for daily/weekly payment plans)
unitSchema.methods.getAffordabilityBreakdown = function() {
  const monthly = this.currentPrice;
  const daily = Math.round(monthly / 30);
  const weekly = Math.round(monthly / 4);
  const biWeekly = Math.round(monthly / 2);

  return {
    monthly,
    biWeekly,
    weekly,
    daily,
    // Micro-savings target (allow saving over 30 days)
    microSavings: {
      target: monthly,
      dailyMinimum: Math.round(monthly / 30),
      suggestedDaily: Math.round(monthly / 25) // Save in 25 days, 5-day buffer
    }
  };
};

// Method to increment view count
unitSchema.methods.incrementViewCount = function() {
  this.performance.viewCount += 1;
  return this.save();
};

// Method to get image by room
unitSchema.methods.getImagesByRoom = function(room) {
  return this.images.filter(img => img.room === room);
};

// Method to check media quality
unitSchema.methods.hasQualityMedia = function() {
  const minPhotos = 12;
  const photoCount = this.images.filter(img => img.type === 'photo').length;

  return {
    meetsMinimum: photoCount >= minPhotos,
    photoCount,
    hasVideo: this.videoWalkthrough.available,
    has360Tour: this.virtualTour.available,
    completeness: this.mediaCompleteness,
    allowsVirtualBooking: this.allowVirtualViewingOnly
  };
};

// Static method to find affordable units
unitSchema.statics.findAffordableUnits = async function(maxDailyBudget, filters = {}) {
  const maxMonthly = maxDailyBudget * 30;

  const query = {
    availabilityStatus: 'available',
    currentPrice: { $lte: maxMonthly },
    ...filters
  };

  return this.find(query)
    .populate('propertyId', 'basicInfo location media')
    .sort({ currentPrice: 1 })
    .lean();
};

// Static method to find units with complete media
unitSchema.statics.findUnitsWithVirtualTours = async function(filters = {}) {
  return this.find({
    ...filters,
    $or: [
      { 'virtualTour.available': true },
      { 'videoWalkthrough.available': true },
      { mediaCompleteness: { $gte: 80 } }
    ]
  })
  .populate('propertyId', 'basicInfo location')
  .sort({ mediaCompleteness: -1 })
  .lean();
};

const Unit = mongoose.model('Unit', unitSchema);

export default Unit;
