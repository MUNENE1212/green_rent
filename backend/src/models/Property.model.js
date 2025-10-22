import mongoose from 'mongoose';

const { Schema } = mongoose;

const propertySchema = new Schema({
  landlordId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  basicInfo: {
    name: {
      type: String,
      required: [true, 'Property name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Property description is required']
    },
    propertyType: {
      type: String,
      enum: ['apartment', 'house', 'studio', 'bedsitter', 'mansion', 'townhouse', 'compound'],
      required: true
    },
    yearBuilt: Number,
    totalUnits: {
      type: Number,
      required: true,
      min: 1
    },
    totalFloors: {
      type: Number,
      min: 0
    },
    parkingSpaces: {
      type: Number,
      default: 0
    }
  },

  location: {
    address: {
      street: {
        type: String,
        required: true
      },
      area: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      county: {
        type: String,
        required: true
      },
      postalCode: String,
      landmark: String
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function(arr) {
            return arr.length === 2 &&
                   arr[0] >= -180 && arr[0] <= 180 &&
                   arr[1] >= -90 && arr[1] <= 90;
          },
          message: 'Invalid coordinates'
        }
      }
    },
    accessibility: {
      publicTransport: {
        type: Boolean,
        default: false
      },
      nearbyFacilities: [String],
      distanceToCity: Number // in kilometers
    }
  },

  amenities: {
    property: [{
      name: {
        type: String,
        required: true
      },
      category: {
        type: String,
        enum: ['security', 'utilities', 'facilities', 'services'],
        required: true
      },
      included: {
        type: Boolean,
        default: true
      },
      additionalCost: {
        type: Number,
        default: 0
      },
      description: String
    }],
    nearby: [{
      type: {
        type: String,
        enum: ['school', 'hospital', 'mall', 'restaurant', 'gym', 'bank', 'market', 'mosque', 'church'],
        required: true
      },
      name: String,
      distance: Number // in meters
    }]
  },

  utilities: {
    water: {
      source: {
        type: String,
        enum: ['municipal', 'borehole', 'both'],
        default: 'municipal'
      },
      meterType: {
        type: String,
        enum: ['shared', 'individual'],
        default: 'individual'
      },
      included: {
        type: Boolean,
        default: false
      },
      ratePerUnit: Number,
      providerInfo: String
    },
    electricity: {
      provider: {
        type: String,
        default: 'Kenya Power'
      },
      meterType: {
        type: String,
        enum: ['prepaid', 'postpaid', 'shared'],
        default: 'prepaid'
      },
      included: {
        type: Boolean,
        default: false
      },
      ratePerUnit: Number
    },
    internet: {
      available: {
        type: Boolean,
        default: false
      },
      provider: String,
      included: {
        type: Boolean,
        default: false
      },
      speed: String
    },
    gas: {
      available: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        enum: ['piped', 'cylinder'],
        default: 'cylinder'
      },
      included: {
        type: Boolean,
        default: false
      }
    }
  },

  media: [{
    type: {
      type: String,
      enum: ['image', 'video', '360_tour', 'floor_plan', 'neighborhood', 'amenity_photo'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    caption: String,
    room: {
      type: String,
      enum: ['exterior', 'living_room', 'bedroom', 'kitchen', 'bathroom', 'balcony', 'parking', 'compound', 'amenity', 'neighborhood'],
      default: 'exterior'
    },
    order: {
      type: Number,
      default: 0
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  virtualTour: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: {
      type: String,
      enum: ['matterport', 'kuula', 'custom', 'other'],
      default: 'custom'
    },
    tourUrl: String,
    embedCode: String
  },

  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    priceRange: {
      min: {
        type: Number,
        required: true,
        min: 0
      },
      max: {
        type: Number,
        required: true,
        min: 0
      }
    },
    deposit: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      refundable: {
        type: Boolean,
        default: true
      }
    },
    otherFees: [{
      name: String,
      amount: Number,
      frequency: {
        type: String,
        enum: ['one-time', 'monthly', 'annual'],
        default: 'one-time'
      },
      mandatory: {
        type: Boolean,
        default: true
      }
    }]
  },

  occupancy: {
    totalUnits: {
      type: Number,
      required: true
    },
    occupiedUnits: {
      type: Number,
      default: 0
    },
    availableUnits: {
      type: Number,
      default: 0
    },
    maintenanceUnits: {
      type: Number,
      default: 0
    },
    occupancyRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  management: {
    propertyManager: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    caretaker: {
      name: String,
      phone: String
    },
    maintenanceContact: String
  },

  settings: {
    acceptingTenants: {
      type: Boolean,
      default: true
    },
    requiresDeposit: {
      type: Boolean,
      default: true
    },
    allowsPets: {
      type: Boolean,
      default: false
    },
    smokingAllowed: {
      type: Boolean,
      default: false
    },
    minimumLeaseMonths: {
      type: Number,
      default: 12
    },
    maximumOccupants: Number,
    virtualViewingOnly: {
      type: Boolean,
      default: false
    }
  },

  performance: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    inquiryCount: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'under_maintenance', 'pending_approval', 'deleted'],
    default: 'pending_approval'
  },

  featured: {
    type: Boolean,
    default: false
  },

  verifiedProperty: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
propertySchema.index({ landlordId: 1 });
propertySchema.index({ 'location.coordinates': '2dsphere' });
propertySchema.index({ status: 1 });
propertySchema.index({ 'basicInfo.propertyType': 1 });
propertySchema.index({ 'pricing.basePrice': 1 });
propertySchema.index({ featured: 1 });
propertySchema.index({ 'location.address.city': 1 });
propertySchema.index({ 'location.address.area': 1 });

// Virtual for units (will populate from Unit model)
propertySchema.virtual('units', {
  ref: 'Unit',
  localField: '_id',
  foreignField: 'propertyId'
});

// Method to calculate and update occupancy rate
propertySchema.methods.updateOccupancyRate = async function() {
  const Unit = mongoose.model('Unit');

  const totalUnits = await Unit.countDocuments({ propertyId: this._id });
  const occupiedUnits = await Unit.countDocuments({
    propertyId: this._id,
    availabilityStatus: 'occupied'
  });
  const availableUnits = await Unit.countDocuments({
    propertyId: this._id,
    availabilityStatus: 'available'
  });
  const maintenanceUnits = await Unit.countDocuments({
    propertyId: this._id,
    availabilityStatus: 'maintenance'
  });

  this.occupancy.totalUnits = totalUnits;
  this.occupancy.occupiedUnits = occupiedUnits;
  this.occupancy.availableUnits = availableUnits;
  this.occupancy.maintenanceUnits = maintenanceUnits;
  this.occupancy.occupancyRate = totalUnits > 0
    ? Math.round((occupiedUnits / totalUnits) * 100)
    : 0;

  return this.save();
};

// Method to calculate media completeness
propertySchema.methods.getMediaCompleteness = function() {
  const requiredPhotos = 15;
  const hasVideo = this.media.some(m => m.type === 'video');
  const has360Tour = this.virtualTour.enabled;
  const photoCount = this.media.filter(m => m.type === 'image').length;

  let score = 0;
  score += Math.min((photoCount / requiredPhotos) * 60, 60); // Up to 60% for photos
  score += hasVideo ? 20 : 0; // 20% for video
  score += has360Tour ? 20 : 0; // 20% for virtual tour

  return Math.round(score);
};

// Method to increment view count
propertySchema.methods.incrementViewCount = function() {
  this.performance.viewCount += 1;
  return this.save();
};

// Method to set primary image
propertySchema.methods.setPrimaryImage = function(imageId) {
  this.media.forEach(m => {
    m.isPrimary = m._id.toString() === imageId.toString();
  });
  return this.save();
};

const Property = mongoose.model('Property', propertySchema);

export default Property;
