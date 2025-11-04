import mongoose from 'mongoose';

const { Schema } = mongoose;

const maintenanceRequestSchema = new Schema({
  requestNumber: {
    type: String,
    unique: true,
    required: true
  },

  unitId: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },

  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  landlordId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  category: {
    type: String,
    enum: [
      'plumbing',
      'electrical',
      'structural',
      'appliance',
      'pest_control',
      'painting',
      'carpentry',
      'general',
      'other'
    ],
    required: true
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },

  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },

  description: {
    type: String,
    required: [true, 'Description is required']
  },

  status: {
    type: String,
    enum: [
      'pending',
      'acknowledged',
      'assigned',
      'in_progress',
      'completed',
      'cancelled',
      'on_hold'
    ],
    default: 'pending'
  },

  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  assignedTo: {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    vendorName: String,
    vendorPhone: String,
    vendorCompany: String,
    assignedAt: Date,
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  scheduling: {
    scheduledDate: Date,
    scheduledTime: String,
    estimatedDuration: Number, // in hours
    actualStartTime: Date,
    actualEndTime: Date,
    tenantAvailable: {
      type: Boolean,
      default: true
    },
    accessInstructions: String
  },

  costing: {
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0
    },
    actualCost: {
      type: Number,
      default: 0,
      min: 0
    },
    paidBy: {
      type: String,
      enum: ['tenant', 'landlord', 'shared'],
      default: 'landlord'
    },
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'paid'],
      default: 'not_required'
    },
    invoiceUrl: String
  },

  resolution: {
    resolutionNotes: String,
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date,
    completionImages: [String],
    warranty: {
      provided: {
        type: Boolean,
        default: false
      },
      durationDays: Number,
      expiresAt: Date
    }
  },

  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    reviewDate: Date,
    wouldRecommend: Boolean
  },

  communication: [{
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [String]
  }],

  notes: String,
  internalNotes: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Note: requestNumber already has unique index from field definition
maintenanceRequestSchema.index({ unitId: 1 });
maintenanceRequestSchema.index({ tenantId: 1 });
maintenanceRequestSchema.index({ landlordId: 1 });
maintenanceRequestSchema.index({ status: 1 });
maintenanceRequestSchema.index({ priority: 1 });
maintenanceRequestSchema.index({ category: 1 });
maintenanceRequestSchema.index({ createdAt: -1 });

// Compound indexes
maintenanceRequestSchema.index({ unitId: 1, status: 1 });
maintenanceRequestSchema.index({ status: 1, priority: -1, createdAt: -1 });

// Virtual for duration
maintenanceRequestSchema.virtual('duration').get(function() {
  if (!this.scheduling.actualStartTime || !this.scheduling.actualEndTime) return null;

  const diff = this.scheduling.actualEndTime - this.scheduling.actualStartTime;
  return Math.round(diff / (1000 * 60 * 60)); // hours
});

// Generate request number before saving
maintenanceRequestSchema.pre('save', async function(next) {
  if (!this.requestNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });

    this.requestNumber = `MNT-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Method to acknowledge request
maintenanceRequestSchema.methods.acknowledge = async function(acknowledgedBy) {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be acknowledged');
  }

  this.status = 'acknowledged';

  return this.save();
};

// Method to assign to vendor
maintenanceRequestSchema.methods.assign = async function(vendorData, assignedBy) {
  this.assignedTo = {
    ...vendorData,
    assignedAt: Date.now(),
    assignedBy
  };

  this.status = 'assigned';

  return this.save();
};

// Method to schedule maintenance
maintenanceRequestSchema.methods.schedule = async function(scheduledDate, scheduledTime, estimatedDuration) {
  if (this.status === 'pending') {
    throw new Error('Request must be assigned before scheduling');
  }

  this.scheduling.scheduledDate = scheduledDate;
  this.scheduling.scheduledTime = scheduledTime;
  this.scheduling.estimatedDuration = estimatedDuration;

  return this.save();
};

// Method to start work
maintenanceRequestSchema.methods.startWork = async function() {
  if (this.status !== 'assigned') {
    throw new Error('Request must be assigned before starting work');
  }

  this.status = 'in_progress';
  this.scheduling.actualStartTime = Date.now();

  return this.save();
};

// Method to complete request
maintenanceRequestSchema.methods.complete = async function(resolutionData) {
  if (this.status !== 'in_progress') {
    throw new Error('Only in-progress requests can be completed');
  }

  this.status = 'completed';
  this.scheduling.actualEndTime = Date.now();

  this.resolution = {
    ...resolutionData,
    completedAt: Date.now()
  };

  // Set warranty expiry if warranty provided
  if (this.resolution.warranty && this.resolution.warranty.provided) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.resolution.warranty.durationDays);
    this.resolution.warranty.expiresAt = expiryDate;
  }

  return this.save();
};

// Method to cancel request
maintenanceRequestSchema.methods.cancel = async function(reason) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel a completed request');
  }

  this.status = 'cancelled';
  this.notes = reason;

  return this.save();
};

// Method to add comment
maintenanceRequestSchema.methods.addComment = async function(from, message, attachments = []) {
  this.communication.push({
    from,
    message,
    attachments
  });

  return this.save();
};

// Method to submit feedback
maintenanceRequestSchema.methods.submitFeedback = async function(rating, review, wouldRecommend) {
  if (this.status !== 'completed') {
    throw new Error('Can only submit feedback for completed requests');
  }

  this.feedback = {
    rating,
    review,
    reviewDate: Date.now(),
    wouldRecommend
  };

  return this.save();
};

// Static method to get pending requests by priority
maintenanceRequestSchema.statics.getPendingByPriority = async function(landlordId) {
  return this.find({
    landlordId,
    status: { $in: ['pending', 'acknowledged', 'assigned'] }
  })
  .populate('unitId', 'unitNumber')
  .populate('tenantId', 'profile.firstName profile.lastName phone')
  .sort({ priority: -1, createdAt: 1 })
  .lean();
};

// Static method to get overdue requests
maintenanceRequestSchema.statics.getOverdueRequests = async function() {
  const now = new Date();

  return this.find({
    status: { $in: ['assigned', 'in_progress'] },
    'scheduling.scheduledDate': { $lt: now }
  })
  .populate('unitId', 'unitNumber')
  .populate('tenantId', 'profile.firstName profile.lastName phone')
  .populate('landlordId', 'profile.firstName profile.lastName phone')
  .sort({ 'scheduling.scheduledDate': 1 });
};

// Static method to get maintenance statistics
maintenanceRequestSchema.statics.getStatistics = async function(unitId, months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const stats = await this.aggregate([
    {
      $match: {
        unitId: mongoose.Types.ObjectId(unitId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgCost: { $avg: '$costing.actualCost' },
        avgRating: { $avg: '$feedback.rating' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return stats;
};

const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

export default MaintenanceRequest;
