import mongoose from 'mongoose';

const { Schema } = mongoose;

const bookingSchema = new Schema({
  bookingNumber: {
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

  bookingType: {
    type: String,
    enum: ['physical_viewing', 'virtual_viewing', 'direct_reservation', 'express_move_in'],
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'expired', 'converted_to_lease'],
    default: 'pending'
  },

  bookingFee: {
    type: Number,
    default: 0,
    min: 0
  },

  bookingFeePaid: {
    type: Boolean,
    default: false
  },

  bookingFeePaymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },

  skipPhysicalViewing: {
    type: Boolean,
    default: false
  },

  viewingDetails: {
    preferredDate: Date,
    preferredTime: String,
    alternativeDates: [{
      date: Date,
      time: String
    }],
    confirmed: {
      type: Boolean,
      default: false
    },
    confirmedDate: Date,
    confirmedTime: String,
    meetingPoint: String,
    specialRequests: String
  },

  reservationDetails: {
    reservationPeriod: {
      type: Number, // in days
      default: 7,
      min: 1,
      max: 30
    },
    expiresAt: Date,
    autoConvertToLease: {
      type: Boolean,
      default: false
    },
    leaseStartDate: Date
  },

  cancellationDetails: {
    cancelledBy: {
      type: String,
      enum: ['tenant', 'landlord', 'system']
    },
    reason: String,
    cancelledAt: Date,
    refundAmount: {
      type: Number,
      default: 0
    },
    refundProcessed: {
      type: Boolean,
      default: false
    }
  },

  paymentDetails: {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    },
    amount: Number,
    method: String,
    paidAt: Date
  },

  virtualViewingData: {
    viewed360Tour: {
      type: Boolean,
      default: false
    },
    watchedVideo: {
      type: Boolean,
      default: false
    },
    viewedPhotos: {
      type: Number,
      default: 0
    },
    totalViewTime: {
      type: Number, // in seconds
      default: 0
    },
    virtualViewingCompletedAt: Date
  },

  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },

  notes: String,
  confirmedAt: Date,
  completedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Note: bookingNumber already has unique index from field definition
bookingSchema.index({ unitId: 1 });
bookingSchema.index({ tenantId: 1 });
bookingSchema.index({ landlordId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingType: 1 });
bookingSchema.index({ 'reservationDetails.expiresAt': 1 });
bookingSchema.index({ createdAt: -1 });

// Compound indexes
bookingSchema.index({ unitId: 1, status: 1 });
bookingSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

// Virtual for unit details
bookingSchema.virtual('unit', {
  ref: 'Unit',
  localField: 'unitId',
  foreignField: '_id',
  justOne: true
});

// Virtual for is expired
bookingSchema.virtual('isExpired').get(function() {
  if (!this.reservationDetails.expiresAt) return false;
  return this.status === 'pending' && this.reservationDetails.expiresAt < new Date();
});

// Generate booking number before saving
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });

    const typePrefix = {
      'physical_viewing': 'PV',
      'virtual_viewing': 'VV',
      'direct_reservation': 'RES',
      'express_move_in': 'EXP'
    };

    const prefix = typePrefix[this.bookingType] || 'BK';
    this.bookingNumber = `${prefix}-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  // Set expiry date for reservations
  if (this.isNew && this.bookingType === 'direct_reservation' && !this.reservationDetails.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.reservationDetails.reservationPeriod);
    this.reservationDetails.expiresAt = expiryDate;
  }

  next();
});

// Method to confirm viewing
bookingSchema.methods.confirmViewing = async function(confirmedDate, confirmedTime, meetingPoint) {
  if (this.bookingType !== 'physical_viewing' && this.bookingType !== 'virtual_viewing') {
    throw new Error('Only viewing bookings can be confirmed');
  }

  this.viewingDetails.confirmed = true;
  this.viewingDetails.confirmedDate = confirmedDate;
  this.viewingDetails.confirmedTime = confirmedTime;
  this.viewingDetails.meetingPoint = meetingPoint;
  this.status = 'confirmed';
  this.confirmedAt = Date.now();

  return this.save();
};

// Method to complete viewing
bookingSchema.methods.completeViewing = async function() {
  if (!this.viewingDetails.confirmed) {
    throw new Error('Viewing must be confirmed before completion');
  }

  this.status = 'completed';
  this.completedAt = Date.now();

  return this.save();
};

// Method to reserve unit
bookingSchema.methods.reserve = async function() {
  if (this.bookingType !== 'direct_reservation' && this.bookingType !== 'express_move_in') {
    throw new Error('Invalid booking type for reservation');
  }

  if (!this.bookingFeePaid) {
    throw new Error('Booking fee must be paid before reservation');
  }

  // Update unit status
  const Unit = mongoose.model('Unit');
  await Unit.findByIdAndUpdate(this.unitId, {
    availabilityStatus: 'reserved'
  });

  this.status = 'confirmed';
  this.confirmedAt = Date.now();

  return this.save();
};

// Method to cancel booking
bookingSchema.methods.cancel = async function(cancelledBy, reason) {
  if (this.status === 'cancelled' || this.status === 'completed') {
    throw new Error('Cannot cancel a completed or already cancelled booking');
  }

  this.status = 'cancelled';

  this.cancellationDetails = {
    cancelledBy,
    reason,
    cancelledAt: Date.now()
  };

  // Calculate refund if applicable
  if (this.bookingFeePaid) {
    const hoursSinceBooking = (Date.now() - this.createdAt) / (1000 * 60 * 60);

    if (hoursSinceBooking < 24) {
      // Full refund within 24 hours
      this.cancellationDetails.refundAmount = this.bookingFee;
    } else if (hoursSinceBooking < 48) {
      // 50% refund within 48 hours
      this.cancellationDetails.refundAmount = this.bookingFee * 0.5;
    }
    // No refund after 48 hours
  }

  // Update unit status if it was reserved
  if (this.bookingType === 'direct_reservation' || this.bookingType === 'express_move_in') {
    const Unit = mongoose.model('Unit');
    const unit = await Unit.findById(this.unitId);

    if (unit && unit.availabilityStatus === 'reserved') {
      await Unit.findByIdAndUpdate(this.unitId, {
        availabilityStatus: 'available'
      });
    }
  }

  return this.save();
};

// Method to convert to lease
bookingSchema.methods.convertToLease = async function(leaseData) {
  if (this.bookingType !== 'direct_reservation' && this.bookingType !== 'express_move_in') {
    throw new Error('Only reservations can be converted to leases');
  }

  if (this.status !== 'confirmed') {
    throw new Error('Only confirmed reservations can be converted');
  }

  // Create lease (this would be done in the lease service)
  this.status = 'converted_to_lease';

  // Booking fee is applied to the lease (deposit or first payment)

  return this.save();
};

// Method to track virtual viewing
bookingSchema.methods.trackVirtualViewing = async function(viewingData) {
  if (this.bookingType !== 'virtual_viewing' && !this.skipPhysicalViewing) {
    throw new Error('Not a virtual viewing booking');
  }

  this.virtualViewingData = {
    ...this.virtualViewingData,
    ...viewingData
  };

  // Auto-complete if sufficient viewing time
  if (this.virtualViewingData.totalViewTime >= 180 && // 3 minutes
      this.virtualViewingData.viewedPhotos >= 10) {
    this.virtualViewingData.virtualViewingCompletedAt = Date.now();
  }

  return this.save();
};

// Method to check if booking is expiring soon
bookingSchema.methods.isExpiringSoon = function(hours = 24) {
  if (!this.reservationDetails.expiresAt) return false;

  const hoursRemaining = (this.reservationDetails.expiresAt - Date.now()) / (1000 * 60 * 60);
  return hoursRemaining > 0 && hoursRemaining <= hours;
};

// Static method to find expiring reservations
bookingSchema.statics.findExpiringReservations = async function(hours = 24) {
  const futureTime = new Date();
  futureTime.setHours(futureTime.getHours() + hours);

  return this.find({
    status: 'confirmed',
    bookingType: { $in: ['direct_reservation', 'express_move_in'] },
    'reservationDetails.expiresAt': {
      $gt: new Date(),
      $lte: futureTime
    }
  })
  .populate('unitId', 'unitNumber currentPrice')
  .populate('tenantId', 'profile.firstName profile.lastName email phone')
  .populate('landlordId', 'profile.firstName profile.lastName email phone')
  .sort({ 'reservationDetails.expiresAt': 1 });
};

// Static method to expire old reservations (run as cron job)
bookingSchema.statics.expireOldReservations = async function() {
  const expired = await this.find({
    status: { $in: ['pending', 'confirmed'] },
    'reservationDetails.expiresAt': { $lt: new Date() }
  });

  for (const booking of expired) {
    await booking.cancel('system', 'Reservation expired');
    booking.status = 'expired';
    await booking.save();
  }

  return expired.length;
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
