import mongoose from 'mongoose';

const { Schema } = mongoose;

const utilityReadingSchema = new Schema({
  unitId: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },

  leaseId: {
    type: Schema.Types.ObjectId,
    ref: 'Lease',
    required: true
  },

  utilityType: {
    type: String,
    enum: ['water', 'electricity', 'gas'],
    required: true
  },

  meterNumber: {
    type: String,
    required: true
  },

  previousReading: {
    type: Number,
    required: true,
    min: 0
  },

  currentReading: {
    type: Number,
    required: true,
    min: 0
  },

  consumption: {
    type: Number,
    required: true,
    min: 0
  },

  ratePerUnit: {
    type: Number,
    required: true,
    min: 0
  },

  totalCost: {
    type: Number,
    required: true,
    min: 0
  },

  readingDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['pending', 'verified', 'disputed', 'billed', 'paid'],
    default: 'pending'
  },

  billingPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },

  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  verification: {
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    notes: String
  },

  dispute: {
    disputed: {
      type: Boolean,
      default: false
    },
    reason: String,
    raisedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    raisedAt: Date,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolution: String
  },

  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },

  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  notes: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
utilityReadingSchema.index({ unitId: 1, utilityType: 1 });
utilityReadingSchema.index({ leaseId: 1 });
utilityReadingSchema.index({ status: 1 });
utilityReadingSchema.index({ readingDate: -1 });
utilityReadingSchema.index({ 'billingPeriod.startDate': 1, 'billingPeriod.endDate': 1 });

// Calculate consumption and cost before saving
utilityReadingSchema.pre('save', function(next) {
  if (this.isModified('currentReading') || this.isModified('previousReading')) {
    this.consumption = this.currentReading - this.previousReading;

    if (this.consumption < 0) {
      return next(new Error('Current reading cannot be less than previous reading'));
    }
  }

  if (this.isModified('consumption') || this.isModified('ratePerUnit')) {
    this.totalCost = Math.round(this.consumption * this.ratePerUnit);
  }

  next();
});

// Method to verify reading
utilityReadingSchema.methods.verify = async function(verifiedBy, notes) {
  this.status = 'verified';
  this.verification = {
    verifiedBy,
    verifiedAt: Date.now(),
    notes
  };

  return this.save();
};

// Method to dispute reading
utilityReadingSchema.methods.disputeReading = async function(raisedBy, reason) {
  this.status = 'disputed';
  this.dispute = {
    disputed: true,
    reason,
    raisedBy,
    raisedAt: Date.now()
  };

  return this.save();
};

// Method to resolve dispute
utilityReadingSchema.methods.resolveDispute = async function(resolvedBy, resolution) {
  this.status = 'verified';
  this.dispute.resolvedBy = resolvedBy;
  this.dispute.resolvedAt = Date.now();
  this.dispute.resolution = resolution;

  return this.save();
};

// Static method to get consumption history
utilityReadingSchema.statics.getConsumptionHistory = async function(unitId, utilityType, months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return this.find({
    unitId,
    utilityType,
    readingDate: { $gte: startDate }
  })
  .sort({ readingDate: 1 })
  .select('readingDate consumption totalCost')
  .lean();
};

// Static method to get average consumption
utilityReadingSchema.statics.getAverageConsumption = async function(unitId, utilityType, months = 3) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const result = await this.aggregate([
    {
      $match: {
        unitId: mongoose.Types.ObjectId(unitId),
        utilityType,
        readingDate: { $gte: startDate },
        status: { $in: ['verified', 'billed', 'paid'] }
      }
    },
    {
      $group: {
        _id: null,
        averageConsumption: { $avg: '$consumption' },
        averageCost: { $avg: '$totalCost' },
        totalConsumption: { $sum: '$consumption' },
        totalCost: { $sum: '$totalCost' }
      }
    }
  ]);

  return result.length > 0 ? result[0] : null;
};

const UtilityReading = mongoose.model('UtilityReading', utilityReadingSchema);

export default UtilityReading;
