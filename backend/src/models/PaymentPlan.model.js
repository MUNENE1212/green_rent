import mongoose from 'mongoose';

const { Schema } = mongoose;

const paymentPlanSchema = new Schema({
  leaseId: {
    type: Schema.Types.ObjectId,
    ref: 'Lease',
    required: true
  },

  planType: {
    type: String,
    enum: [
      'monthly',
      'bi_weekly',
      'weekly',
      'daily',
      'split_monthly',
      'custom',
      'pay_as_you_earn',
      'graduated',
      'seasonal',
      'micro_savings'
    ],
    required: true
  },

  totalMonthlyRent: {
    type: Number,
    required: true,
    min: 0
  },

  active: {
    type: Boolean,
    default: true
  },

  schedule: [{
    installmentNumber: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'waived'],
      default: 'pending'
    },
    paidDate: Date,
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    }
  }],

  flexibility: {
    allowEarlyPayment: {
      type: Boolean,
      default: true
    },
    earlyPaymentDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100 // percentage
    },
    gracePeriodDays: {
      type: Number,
      default: 3,
      min: 0
    },
    latePaymentFee: {
      type: Number,
      default: 0
    },
    allowPartialPayment: {
      type: Boolean,
      default: false
    },
    allowDailyPayments: {
      type: Boolean,
      default: false
    },
    allowMicroDeposits: {
      type: Boolean,
      default: false
    }
  },

  walletIntegration: {
    enabled: {
      type: Boolean,
      default: false
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'RentWallet'
    },
    autoDeductOnDueDate: {
      type: Boolean,
      default: false
    },
    minimumWalletBalance: {
      type: Number,
      default: 0
    }
  },

  autoAdjustment: {
    enabled: {
      type: Boolean,
      default: false
    },
    basedOn: {
      type: String,
      enum: ['income_frequency', 'payment_history', 'seasonal', 'custom'],
      default: 'income_frequency'
    },
    aiRecommended: {
      type: Boolean,
      default: false
    },
    lastAdjustment: Date
  },

  landlordSettings: {
    minimumMonthlyPayout: {
      type: Number,
      default: 0
    },
    acceptsDelayedPayment: {
      type: Boolean,
      default: false
    },
    maxPaymentSplits: {
      type: Number,
      default: 1
    },
    acceptsDailyPayments: {
      type: Boolean,
      default: false
    }
  },

  performance: {
    onTimePaymentRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    outstanding: {
      type: Number,
      default: 0
    },
    averagePaymentTime: {
      type: Number, // days
      default: 0
    }
  },

  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none'
    },
    value: {
      type: Number,
      default: 0
    },
    reason: String
  },

  notes: String,
  lastModified: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentPlanSchema.index({ leaseId: 1 });
paymentPlanSchema.index({ active: 1 });
paymentPlanSchema.index({ planType: 1 });
paymentPlanSchema.index({ 'schedule.dueDate': 1 });
paymentPlanSchema.index({ 'schedule.status': 1 });

// Virtual for next payment
paymentPlanSchema.virtual('nextPayment').get(function() {
  const pending = this.schedule
    .filter(s => s.status === 'pending')
    .sort((a, b) => a.dueDate - b.dueDate);

  return pending.length > 0 ? pending[0] : null;
});

// Virtual for completion percentage
paymentPlanSchema.virtual('completionPercentage').get(function() {
  const total = this.schedule.length;
  const paid = this.schedule.filter(s => s.status === 'paid').length;

  return total > 0 ? Math.round((paid / total) * 100) : 0;
});

// Generate payment schedule before saving
paymentPlanSchema.pre('save', function(next) {
  if (this.isNew && this.schedule.length === 0) {
    this.generateSchedule();
  }
  next();
});

// Method to generate payment schedule
paymentPlanSchema.methods.generateSchedule = function() {
  const startDate = new Date();
  const scheduleItems = [];

  switch (this.planType) {
    case 'monthly':
      // One payment per month
      for (let i = 0; i < 12; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        dueDate.setDate(1); // First of the month

        scheduleItems.push({
          installmentNumber: i + 1,
          amount: this.totalMonthlyRent,
          dueDate,
          description: `Monthly rent - ${dueDate.toLocaleString('default', { month: 'long' })} ${dueDate.getFullYear()}`
        });
      }
      break;

    case 'bi_weekly':
      // Two payments per month
      for (let i = 0; i < 24; i++) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (i * 14)); // Every 14 days

        scheduleItems.push({
          installmentNumber: i + 1,
          amount: this.totalMonthlyRent / 2,
          dueDate,
          description: `Bi-weekly payment ${i + 1}`
        });
      }
      break;

    case 'weekly':
      // Four payments per month
      for (let i = 0; i < 52; i++) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (i * 7)); // Every 7 days

        scheduleItems.push({
          installmentNumber: i + 1,
          amount: this.totalMonthlyRent / 4,
          dueDate,
          description: `Weekly payment ${i + 1}`
        });
      }
      break;

    case 'daily':
      // 30 payments per month
      for (let i = 0; i < 360; i++) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + i);

        scheduleItems.push({
          installmentNumber: i + 1,
          amount: Math.round(this.totalMonthlyRent / 30),
          dueDate,
          description: `Daily payment ${i + 1}`
        });
      }
      break;

    case 'split_monthly':
      // Split into multiple payments (default: 2)
      const splits = this.landlordSettings.maxPaymentSplits || 2;
      for (let i = 0; i < 12; i++) {
        for (let j = 0; j < splits; j++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + i);
          dueDate.setDate(Math.floor((30 / splits) * j) + 1);

          scheduleItems.push({
            installmentNumber: (i * splits) + j + 1,
            amount: this.totalMonthlyRent / splits,
            dueDate,
            description: `Split payment ${j + 1} of month ${i + 1}`
          });
        }
      }
      break;

    default:
      // Default to monthly
      for (let i = 0; i < 12; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        dueDate.setDate(1);

        scheduleItems.push({
          installmentNumber: i + 1,
          amount: this.totalMonthlyRent,
          dueDate,
          description: `Payment ${i + 1}`
        });
      }
  }

  this.schedule = scheduleItems;
};

// Method to mark installment as paid
paymentPlanSchema.methods.markInstallmentPaid = async function(installmentNumber, paymentId) {
  const installment = this.schedule.find(s => s.installmentNumber === installmentNumber);

  if (!installment) {
    throw new Error('Installment not found');
  }

  if (installment.status === 'paid') {
    throw new Error('Installment already paid');
  }

  installment.status = 'paid';
  installment.paidDate = Date.now();
  installment.paymentId = paymentId;

  // Update performance metrics
  this.performance.totalPaid += installment.amount;
  this.performance.outstanding = this.getTotalOutstanding();

  // Calculate average payment time
  const daysDiff = Math.floor((Date.now() - installment.dueDate) / (1000 * 60 * 60 * 24));
  const paidCount = this.schedule.filter(s => s.status === 'paid').length;

  this.performance.averagePaymentTime =
    ((this.performance.averagePaymentTime * (paidCount - 1)) + daysDiff) / paidCount;

  // Update on-time payment rate
  const onTimePayments = this.schedule.filter(
    s => s.status === 'paid' && s.paidDate <= s.dueDate
  ).length;
  this.performance.onTimePaymentRate = Math.round((onTimePayments / paidCount) * 100);

  return this.save();
};

// Method to get total outstanding amount
paymentPlanSchema.methods.getTotalOutstanding = function() {
  return this.schedule
    .filter(s => s.status === 'pending' || s.status === 'overdue')
    .reduce((sum, s) => sum + s.amount, 0);
};

// Method to get overdue installments
paymentPlanSchema.methods.getOverdueInstallments = function() {
  const now = new Date();

  return this.schedule.filter(s =>
    s.status === 'pending' &&
    s.dueDate < now
  );
};

// Method to update overdue status
paymentPlanSchema.methods.updateOverdueStatus = async function() {
  const now = new Date();

  this.schedule.forEach(installment => {
    if (installment.status === 'pending' && installment.dueDate < now) {
      installment.status = 'overdue';
    }
  });

  return this.save();
};

// Method to adjust plan based on payment history
paymentPlanSchema.methods.adjustBasedOnHistory = async function() {
  if (!this.autoAdjustment.enabled) return;

  // Logic to adjust payment plan based on tenant's payment history
  // This can be enhanced with AI/ML later

  const overdueCount = this.getOverdueInstallments().length;
  const onTimeRate = this.performance.onTimePaymentRate;

  // If tenant is consistently late, suggest changing to more frequent, smaller payments
  if (overdueCount > 2 && onTimeRate < 70) {
    // Suggest switching to more frequent payments
    this.notes = 'Consider switching to more frequent payments (weekly or daily)';
  }

  this.autoAdjustment.lastAdjustment = Date.now();
  return this.save();
};

// Static method to get recommended plan
paymentPlanSchema.statics.getRecommendedPlan = function(monthlyRent, tenantIncomeFrequency, paymentHistory) {
  let planType = 'monthly'; // Default

  // Map income frequency to payment plan
  const frequencyMap = {
    'daily': 'daily',
    'weekly': 'weekly',
    'bi-weekly': 'bi_weekly',
    'monthly': 'monthly'
  };

  planType = frequencyMap[tenantIncomeFrequency] || 'monthly';

  // Adjust based on payment history
  if (paymentHistory && paymentHistory.latePayments > paymentHistory.onTimePayments) {
    // Suggest more frequent payments for better cash flow management
    if (planType === 'monthly') planType = 'bi_weekly';
    if (planType === 'bi_weekly') planType = 'weekly';
  }

  return {
    recommendedPlan: planType,
    reasoning: `Based on your ${tenantIncomeFrequency} income frequency`,
    confidence: 0.85
  };
};

const PaymentPlan = mongoose.model('PaymentPlan', paymentPlanSchema);

export default PaymentPlan;
