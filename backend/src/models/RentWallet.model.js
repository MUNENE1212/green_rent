import mongoose from 'mongoose';

const { Schema } = mongoose;

const rentWalletSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  leaseId: {
    type: Schema.Types.ObjectId,
    ref: 'Lease',
    default: null
  },

  walletType: {
    type: String,
    enum: ['rent_savings', 'deposit_savings', 'general_savings'],
    default: 'rent_savings'
  },

  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },

  lockedBalance: {
    type: Number,
    default: 0,
    min: 0
  },

  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },

  autoDeduct: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ['active', 'locked', 'completed', 'closed'],
    default: 'active',
    index: true
  },

  deposits: [{
    amount: {
      type: Number,
      required: true,
      min: 10 // Minimum KES 10
    },
    source: {
      type: String,
      enum: ['mpesa', 'card', 'bank', 'salary_deduction', 'bonus', 'referral'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    },
    description: String
  }],

  withdrawals: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      enum: ['rent_payment', 'emergency', 'change_of_plans', 'cancelled_lease', 'user_request'],
      required: true
    },
    fee: {
      type: Number,
      default: 0
    },
    netAmount: Number,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'cancelled'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    transactionId: String
  }],

  autoSaveRules: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
      default: 'daily'
    },
    amount: {
      type: Number,
      min: 10
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    },
    timeOfDay: {
      type: String, // Format: "HH:MM"
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Invalid time format. Use HH:MM'
      }
    },
    lastExecuted: Date
  },

  milestones: {
    targetReached: {
      type: Boolean,
      default: false
    },
    percentComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    daysToTarget: Number,
    projectedCompletionDate: Date
  },

  incentives: {
    streakDays: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    bonusEarned: {
      type: Number,
      default: 0
    },
    badges: [{
      name: String,
      description: String,
      earnedAt: Date,
      icon: String
    }]
  },

  interestRate: {
    type: Number,
    default: 0.005 // 0.5% monthly for free tier
  },

  bonusEarned: {
    type: Number,
    default: 0
  },

  lastDepositAt: Date,
  lastInterestCalculation: Date,
  targetReachedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
rentWalletSchema.index({ userId: 1 });
rentWalletSchema.index({ leaseId: 1 });
rentWalletSchema.index({ status: 1 });
rentWalletSchema.index({ balance: 1 });
rentWalletSchema.index({ createdAt: -1 });

// Virtual for available balance (total - locked)
rentWalletSchema.virtual('availableBalance').get(function() {
  return this.balance - this.lockedBalance;
});

// Update milestones before saving
rentWalletSchema.pre('save', function(next) {
  if (this.isModified('balance') || this.isModified('targetAmount')) {
    // Calculate percentage complete
    this.milestones.percentComplete = this.targetAmount > 0
      ? Math.min(Math.round((this.balance / this.targetAmount) * 100), 100)
      : 0;

    // Check if target reached
    if (this.balance >= this.targetAmount && !this.milestones.targetReached) {
      this.milestones.targetReached = true;
      this.targetReachedAt = Date.now();
    }

    // Project completion date based on recent deposit pattern
    if (this.deposits.length >= 3) {
      const recentDeposits = this.deposits.slice(-7); // Last 7 deposits
      const totalRecent = recentDeposits.reduce((sum, d) => sum + d.amount, 0);
      const avgDailyDeposit = totalRecent / 7;

      if (avgDailyDeposit > 0) {
        const remaining = this.targetAmount - this.balance;
        const daysNeeded = Math.ceil(remaining / avgDailyDeposit);
        this.milestones.daysToTarget = daysNeeded;

        const projectedDate = new Date();
        projectedDate.setDate(projectedDate.getDate() + daysNeeded);
        this.milestones.projectedCompletionDate = projectedDate;
      }
    }
  }
  next();
});

// Method to deposit money
rentWalletSchema.methods.deposit = async function(amount, source, transactionId, description) {
  if (amount < 10) {
    throw new Error('Minimum deposit is KES 10');
  }

  if (this.status !== 'active') {
    throw new Error('Wallet is not active');
  }

  // Add deposit
  this.deposits.push({
    amount,
    source,
    transactionId,
    description,
    timestamp: Date.now()
  });

  // Update balance
  this.balance += amount;
  this.lastDepositAt = Date.now();

  // Update streak
  await this.updateStreak();

  // Check for milestone bonuses
  await this.checkMilestoneBonuses();

  return this.save();
};

// Method to withdraw money
rentWalletSchema.methods.requestWithdrawal = async function(amount, reason) {
  if (amount > this.availableBalance) {
    throw new Error('Insufficient balance');
  }

  const isEmergency = reason === 'emergency';
  const fee = isEmergency ? amount * 0.05 : 0; // 5% fee for emergency withdrawals
  const netAmount = amount - fee;

  this.withdrawals.push({
    amount,
    reason,
    fee,
    netAmount,
    status: isEmergency ? 'approved' : 'pending',
    requestedAt: Date.now()
  });

  // Lock the amount
  this.lockedBalance += amount;

  return this.save();
};

// Method to complete withdrawal
rentWalletSchema.methods.completeWithdrawal = async function(withdrawalId, transactionId) {
  const withdrawal = this.withdrawals.id(withdrawalId);

  if (!withdrawal) {
    throw new Error('Withdrawal not found');
  }

  if (withdrawal.status !== 'approved') {
    throw new Error('Withdrawal not approved');
  }

  withdrawal.status = 'completed';
  withdrawal.processedAt = Date.now();
  withdrawal.transactionId = transactionId;

  // Update balances
  this.balance -= withdrawal.amount;
  this.lockedBalance -= withdrawal.amount;

  return this.save();
};

// Method to update streak
rentWalletSchema.methods.updateStreak = async function() {
  if (!this.lastDepositAt) {
    this.incentives.streakDays = 1;
    return;
  }

  const today = new Date().setHours(0, 0, 0, 0);
  const lastDeposit = new Date(this.lastDepositAt).setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today - lastDeposit) / (1000 * 60 * 60 * 24));

  if (daysDiff === 1) {
    // Consecutive day
    this.incentives.streakDays += 1;

    // Update longest streak
    if (this.incentives.streakDays > this.incentives.longestStreak) {
      this.incentives.longestStreak = this.incentives.streakDays;
    }
  } else if (daysDiff > 1) {
    // Streak broken
    this.incentives.streakDays = 1;
  }
  // If daysDiff === 0, it's the same day, don't change streak
};

// Method to check and award milestone bonuses
rentWalletSchema.methods.checkMilestoneBonuses = async function() {
  const percentComplete = this.milestones.percentComplete;

  // Award badges and bonuses at milestones
  const milestones = [
    { percent: 25, bonus: 50, badge: '25% Milestone' },
    { percent: 50, bonus: 100, badge: 'Halfway There!' },
    { percent: 75, bonus: 150, badge: 'Almost There!' },
    { percent: 100, bonus: 200, badge: 'Target Reached!' }
  ];

  for (const milestone of milestones) {
    if (percentComplete >= milestone.percent) {
      const hasEarned = this.incentives.badges.some(b => b.name === milestone.badge);

      if (!hasEarned) {
        // Award bonus
        this.balance += milestone.bonus;
        this.bonusEarned += milestone.bonus;
        this.incentives.bonusEarned += milestone.bonus;

        // Add badge
        this.incentives.badges.push({
          name: milestone.badge,
          description: `Reached ${milestone.percent}% of your savings target`,
          earnedAt: Date.now(),
          icon: '🏆'
        });
      }
    }
  }

  // Streak bonuses
  const streakMilestones = [
    { days: 7, bonus: 50, badge: '7-Day Streak' },
    { days: 14, bonus: 150, badge: '14-Day Streak' },
    { days: 30, bonus: 300, badge: 'Perfect Month' }
  ];

  for (const streak of streakMilestones) {
    if (this.incentives.streakDays === streak.days) {
      const hasEarned = this.incentives.badges.some(b => b.name === streak.badge);

      if (!hasEarned) {
        this.balance += streak.bonus;
        this.bonusEarned += streak.bonus;
        this.incentives.bonusEarned += streak.bonus;

        this.incentives.badges.push({
          name: streak.badge,
          description: `Saved for ${streak.days} consecutive days!`,
          earnedAt: Date.now(),
          icon: '🔥'
        });
      }
    }
  }
};

// Method to calculate interest
rentWalletSchema.methods.calculateInterest = async function() {
  const now = new Date();
  const lastCalc = this.lastInterestCalculation || this.createdAt;
  const daysSinceLastCalc = (now - lastCalc) / (1000 * 60 * 60 * 24);

  // Calculate interest monthly
  if (daysSinceLastCalc >= 30) {
    const interest = this.balance * this.interestRate;

    this.balance += interest;
    this.bonusEarned += interest;
    this.lastInterestCalculation = now;

    return this.save();
  }
};

// Method to use wallet for rent payment
rentWalletSchema.methods.payRentFromWallet = async function(amount, leaseId) {
  if (amount > this.availableBalance) {
    throw new Error('Insufficient wallet balance');
  }

  // Create withdrawal for rent payment
  this.withdrawals.push({
    amount,
    reason: 'rent_payment',
    fee: 0,
    netAmount: amount,
    status: 'completed',
    requestedAt: Date.now(),
    processedAt: Date.now()
  });

  this.balance -= amount;
  this.leaseId = leaseId;

  return this.save();
};

// Static method to get top savers (for leaderboard)
rentWalletSchema.statics.getTopSavers = async function(limit = 10, period = 'month') {
  const startDate = new Date();

  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  return this.aggregate([
    {
      $match: {
        status: 'active',
        'deposits.timestamp': { $gte: startDate }
      }
    },
    {
      $project: {
        userId: 1,
        balance: 1,
        totalDeposits: {
          $sum: {
            $filter: {
              input: '$deposits',
              as: 'deposit',
              cond: { $gte: ['$$deposit.timestamp', startDate] }
            }
          }
        },
        streakDays: '$incentives.streakDays'
      }
    },
    {
      $sort: { balance: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userId: 1,
        userName: {
          $concat: ['$user.profile.firstName', ' ', '$user.profile.lastName']
        },
        balance: 1,
        totalDeposits: 1,
        streakDays: 1
      }
    }
  ]);
};

const RentWallet = mongoose.model('RentWallet', rentWalletSchema);

export default RentWallet;
