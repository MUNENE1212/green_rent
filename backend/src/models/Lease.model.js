import mongoose from 'mongoose';

const { Schema } = mongoose;

const leaseSchema = new Schema({
  leaseNumber: {
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

  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },

  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },

  monthlyRent: {
    type: Number,
    required: [true, 'Monthly rent is required'],
    min: 0
  },

  deposit: {
    type: Number,
    required: [true, 'Deposit is required'],
    min: 0
  },

  depositPaid: {
    type: Boolean,
    default: false
  },

  depositPaidDate: Date,

  utilitiesIncluded: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ['draft', 'pending_tenant_signature', 'pending_landlord_approval', 'active', 'expired', 'terminated', 'renewed'],
    default: 'draft'
  },

  customTerms: [{
    term: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  }],

  documents: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['lease_agreement', 'inventory', 'rules', 'addendum', 'other'],
      default: 'other'
    },
    signedBy: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      signedAt: Date,
      signature: String, // Digital signature data
      ipAddress: String
    }],
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  signatures: {
    tenant: {
      signed: {
        type: Boolean,
        default: false
      },
      signedAt: Date,
      signature: String,
      ipAddress: String
    },
    landlord: {
      signed: {
        type: Boolean,
        default: false
      },
      signedAt: Date,
      signature: String,
      ipAddress: String
    }
  },

  moveInInspection: {
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    photos: [String],
    damages: [{
      description: String,
      location: String,
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'major']
      },
      photo: String
    }]
  },

  moveOutInspection: {
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    photos: [String],
    damages: [{
      description: String,
      location: String,
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'major']
      },
      photo: String,
      cost: Number
    }],
    depositDeductions: [{
      reason: String,
      amount: Number
    }],
    depositRefunded: {
      type: Number,
      default: 0
    }
  },

  terminationDetails: {
    terminatedBy: {
      type: String,
      enum: ['tenant', 'landlord', 'mutual'],
    },
    reason: String,
    requestedDate: Date,
    effectiveDate: Date,
    noticeGiven: {
      type: Number, // days
      min: 0
    },
    penaltyAmount: {
      type: Number,
      default: 0
    },
    notes: String
  },

  renewalDetails: {
    renewedFrom: {
      type: Schema.Types.ObjectId,
      ref: 'Lease'
    },
    newEndDate: Date,
    newMonthlyRent: Number,
    renewalDate: Date,
    notes: String
  },

  paymentSummary: {
    totalPaid: {
      type: Number,
      default: 0
    },
    totalDue: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    lastPaymentDate: Date,
    nextPaymentDate: Date
  },

  autoRenew: {
    type: Boolean,
    default: false
  },

  signedAt: Date,
  activatedAt: Date,
  terminatedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Note: leaseNumber already has unique index from field definition
leaseSchema.index({ unitId: 1 });
leaseSchema.index({ tenantId: 1 });
leaseSchema.index({ landlordId: 1 });
leaseSchema.index({ status: 1 });
leaseSchema.index({ startDate: 1, endDate: 1 });
leaseSchema.index({ endDate: 1, status: 1 }); // For finding expiring leases

// Virtual for duration in months
leaseSchema.virtual('durationMonths').get(function() {
  if (!this.startDate || !this.endDate) return 0;

  const months = (this.endDate.getFullYear() - this.startDate.getFullYear()) * 12 +
                 (this.endDate.getMonth() - this.startDate.getMonth());

  return months;
});

// Virtual for days remaining
leaseSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate || this.status !== 'active') return 0;

  const now = new Date();
  const diff = this.endDate - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(0, days);
});

// Virtual for payment plan
leaseSchema.virtual('paymentPlan', {
  ref: 'PaymentPlan',
  localField: '_id',
  foreignField: 'leaseId',
  justOne: true
});

// Virtual for payments
leaseSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'leaseId'
});

// Generate lease number before saving
leaseSchema.pre('save', async function(next) {
  if (!this.leaseNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });

    this.leaseNumber = `LSE-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Method to check if lease is active
leaseSchema.methods.isActive = function() {
  return this.status === 'active' &&
         this.startDate <= new Date() &&
         this.endDate >= new Date();
};

// Method to check if lease is expiring soon
leaseSchema.methods.isExpiringSoon = function(days = 30) {
  if (this.status !== 'active') return false;

  const daysRemaining = this.daysRemaining;
  return daysRemaining > 0 && daysRemaining <= days;
};

// Method to sign lease (tenant or landlord)
leaseSchema.methods.sign = async function(userId, role, signature, ipAddress) {
  if (role !== 'tenant' && role !== 'landlord') {
    throw new Error('Invalid role');
  }

  this.signatures[role].signed = true;
  this.signatures[role].signedAt = Date.now();
  this.signatures[role].signature = signature;
  this.signatures[role].ipAddress = ipAddress;

  // Update status based on signatures
  if (role === 'tenant') {
    this.status = 'pending_landlord_approval';
  }

  if (this.signatures.tenant.signed && this.signatures.landlord.signed) {
    this.signedAt = Date.now();
    // Don't auto-activate, wait for explicit activation
  }

  return this.save();
};

// Method to activate lease
leaseSchema.methods.activate = async function() {
  if (!this.signatures.tenant.signed || !this.signatures.landlord.signed) {
    throw new Error('Lease must be signed by both parties before activation');
  }

  if (!this.depositPaid) {
    throw new Error('Deposit must be paid before activation');
  }

  this.status = 'active';
  this.activatedAt = Date.now();

  // Update unit status
  const Unit = mongoose.model('Unit');
  await Unit.findByIdAndUpdate(this.unitId, {
    availabilityStatus: 'occupied',
    currentTenant: this.tenantId,
    currentLease: this._id
  });

  return this.save();
};

// Method to terminate lease
leaseSchema.methods.terminate = async function(terminatedBy, reason, noticeGiven, penaltyAmount = 0) {
  this.status = 'terminated';
  this.terminatedAt = Date.now();

  this.terminationDetails = {
    terminatedBy,
    reason,
    requestedDate: Date.now(),
    effectiveDate: Date.now(),
    noticeGiven,
    penaltyAmount,
    notes: ''
  };

  // Update unit status
  const Unit = mongoose.model('Unit');
  await Unit.findByIdAndUpdate(this.unitId, {
    availabilityStatus: 'available',
    currentTenant: null,
    currentLease: null,
    availableFrom: Date.now()
  });

  return this.save();
};

// Method to renew lease
leaseSchema.methods.renew = async function(newEndDate, newMonthlyRent) {
  // Create new lease based on this one
  const Lease = mongoose.model('Lease');

  const newLease = new Lease({
    unitId: this.unitId,
    tenantId: this.tenantId,
    landlordId: this.landlordId,
    startDate: this.endDate,
    endDate: newEndDate,
    monthlyRent: newMonthlyRent || this.monthlyRent,
    deposit: this.deposit,
    depositPaid: true, // Carry over existing deposit
    utilitiesIncluded: this.utilitiesIncluded,
    customTerms: this.customTerms,
    status: 'pending_tenant_signature',
    renewalDetails: {
      renewedFrom: this._id,
      renewalDate: Date.now()
    }
  });

  await newLease.save();

  // Update current lease
  this.status = 'renewed';
  this.renewalDetails = {
    newEndDate,
    newMonthlyRent: newMonthlyRent || this.monthlyRent,
    renewalDate: Date.now()
  };

  await this.save();

  return newLease;
};

// Method to update payment summary
leaseSchema.methods.updatePaymentSummary = async function() {
  const Payment = mongoose.model('Payment');

  const payments = await Payment.find({
    leaseId: this._id,
    status: 'completed'
  });

  this.paymentSummary.totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate total due based on lease duration
  const monthsPassed = Math.max(0, this.durationMonths);
  this.paymentSummary.totalDue = monthsPassed * this.monthlyRent;

  this.paymentSummary.balance = this.paymentSummary.totalDue - this.paymentSummary.totalPaid;

  if (payments.length > 0) {
    const latestPayment = payments.sort((a, b) => b.createdAt - a.createdAt)[0];
    this.paymentSummary.lastPaymentDate = latestPayment.createdAt;
  }

  // Calculate next payment date (1st of next month)
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  this.paymentSummary.nextPaymentDate = nextMonth;

  return this.save();
};

// Static method to find expiring leases
leaseSchema.statics.findExpiringLeases = async function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    status: 'active',
    endDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  })
  .populate('unitId', 'unitNumber')
  .populate('tenantId', 'profile.firstName profile.lastName email phone')
  .populate('landlordId', 'profile.firstName profile.lastName email phone')
  .sort({ endDate: 1 });
};

// Static method to find overdue leases
leaseSchema.statics.findOverdueLeases = async function() {
  return this.find({
    status: 'active',
    'paymentSummary.balance': { $gt: 0 }
  })
  .populate('unitId', 'unitNumber')
  .populate('tenantId', 'profile.firstName profile.lastName email phone')
  .sort({ 'paymentSummary.balance': -1 });
};

const Lease = mongoose.model('Lease', leaseSchema);

export default Lease;
