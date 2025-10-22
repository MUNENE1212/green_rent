import mongoose from 'mongoose';

const { Schema } = mongoose;

const paymentSchema = new Schema({
  leaseId: {
    type: Schema.Types.ObjectId,
    ref: 'Lease',
    index: true
  },

  paymentPlanId: {
    type: Schema.Types.ObjectId,
    ref: 'PaymentPlan'
  },

  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  landlordId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: 0
  },

  type: {
    type: String,
    enum: [
      'rent',
      'deposit',
      'utility',
      'maintenance',
      'penalty',
      'refund',
      'wallet_topup',
      'micro_deposit',
      'booking_fee'
    ],
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ['mpesa', 'card', 'bank_transfer', 'wallet', 'salary_deduction', 'cash'],
    required: true
  },

  walletUsed: {
    type: Boolean,
    default: false
  },

  walletAmount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },

  // IntaSend specific fields
  intasend: {
    invoiceId: String,
    checkoutId: String,
    trackingId: String,
    transactionId: String,
    paymentLink: String,
    callbackData: Schema.Types.Mixed
  },

  breakdown: {
    baseRent: {
      type: Number,
      default: 0
    },
    utilities: {
      type: Number,
      default: 0
    },
    maintenance: {
      type: Number,
      default: 0
    },
    penalties: {
      type: Number,
      default: 0
    },
    otherCharges: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    platformFee: {
      type: Number,
      default: 0
    },
    processingFee: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },

  mpesaDetails: {
    phoneNumber: String,
    mpesaReceiptNumber: String,
    transactionDate: Date,
    accountReference: String,
    transactionDesc: String
  },

  cardDetails: {
    last4Digits: String,
    cardType: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'other']
    },
    cardBrand: String,
    expiryMonth: Number,
    expiryYear: Number
  },

  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    location: {
      country: String,
      city: String
    }
  },

  failureDetails: {
    errorCode: String,
    errorMessage: String,
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetryAt: Date,
    canRetry: {
      type: Boolean,
      default: true
    }
  },

  refund: {
    refunded: {
      type: Boolean,
      default: false
    },
    refundAmount: Number,
    refundDate: Date,
    refundReason: String,
    refundedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  dueDate: Date,
  initiatedAt: Date,
  completedAt: Date,
  failedAt: Date,

  description: String,
  notes: String,
  receiptUrl: String,
  invoiceUrl: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentSchema.index({ leaseId: 1 });
paymentSchema.index({ tenantId: 1 });
paymentSchema.index({ landlordId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'intasend.invoiceId': 1 });
paymentSchema.index({ 'intasend.checkoutId': 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ type: 1, status: 1 });

// Compound indexes
paymentSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ landlordId: 1, status: 1, createdAt: -1 });

// Virtual for net amount (amount - fees)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.breakdown.platformFee - this.breakdown.processingFee;
});

// Virtual for is overdue
paymentSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return this.status === 'pending' && this.dueDate < new Date();
});

// Calculate fees before saving
paymentSchema.pre('save', function(next) {
  if (this.isModified('amount') && !this.breakdown.total) {
    // Calculate platform fee (5%)
    this.breakdown.platformFee = Math.round(this.amount * 0.05);

    // Calculate processing fee (2%)
    this.breakdown.processingFee = Math.round(this.amount * 0.02);

    // Set total
    this.breakdown.total = this.amount;
  }
  next();
});

// Method to mark as completed
paymentSchema.methods.markAsCompleted = async function(transactionData = {}) {
  this.status = 'completed';
  this.completedAt = Date.now();

  // Update IntaSend data if provided
  if (transactionData.intasend) {
    this.intasend = { ...this.intasend, ...transactionData.intasend };
  }

  // Update M-Pesa details if provided
  if (transactionData.mpesa) {
    this.mpesaDetails = { ...this.mpesaDetails, ...transactionData.mpesa };
  }

  // Update card details if provided
  if (transactionData.card) {
    this.cardDetails = { ...this.cardDetails, ...transactionData.card };
  }

  await this.save();

  // Update lease payment summary if this is a rent payment
  if (this.leaseId && this.type === 'rent') {
    const Lease = mongoose.model('Lease');
    const lease = await Lease.findById(this.leaseId);
    if (lease) {
      await lease.updatePaymentSummary();
    }
  }

  // Update tenant payment history
  const User = mongoose.model('User');
  const tenant = await User.findById(this.tenantId);
  if (tenant) {
    tenant.financialProfile.paymentHistory.onTimePayments += 1;
    await tenant.updateCreditScore();
  }

  return this;
};

// Method to mark as failed
paymentSchema.methods.markAsFailed = async function(errorCode, errorMessage) {
  this.status = 'failed';
  this.failedAt = Date.now();

  this.failureDetails.errorCode = errorCode;
  this.failureDetails.errorMessage = errorMessage;
  this.failureDetails.retryCount += 1;

  // Allow up to 3 retries
  if (this.failureDetails.retryCount >= 3) {
    this.failureDetails.canRetry = false;
  }

  return this.save();
};

// Method to retry failed payment
paymentSchema.methods.retry = async function() {
  if (!this.failureDetails.canRetry) {
    throw new Error('Payment cannot be retried');
  }

  if (this.status !== 'failed') {
    throw new Error('Only failed payments can be retried');
  }

  this.status = 'pending';
  this.failureDetails.lastRetryAt = Date.now();

  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = async function(refundAmount, reason, refundedBy) {
  if (this.status !== 'completed') {
    throw new Error('Only completed payments can be refunded');
  }

  if (this.refund.refunded) {
    throw new Error('Payment already refunded');
  }

  if (refundAmount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }

  this.status = 'refunded';
  this.refund = {
    refunded: true,
    refundAmount,
    refundDate: Date.now(),
    refundReason: reason,
    refundedBy
  };

  return this.save();
};

// Static method to get payment statistics
paymentSchema.statics.getStatistics = async function(userId, role = 'tenant', period = 'month') {
  const startDate = new Date();

  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (period === 'year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  const matchField = role === 'tenant' ? 'tenantId' : 'landlordId';

  const stats = await this.aggregate([
    {
      $match: {
        [matchField]: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  return stats;
};

// Static method to find overdue payments
paymentSchema.statics.findOverduePayments = async function() {
  return this.find({
    status: 'pending',
    dueDate: { $lt: new Date() }
  })
  .populate('tenantId', 'profile.firstName profile.lastName email phone')
  .populate('landlordId', 'profile.firstName profile.lastName email phone')
  .populate('leaseId', 'leaseNumber unitId')
  .sort({ dueDate: 1 });
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
