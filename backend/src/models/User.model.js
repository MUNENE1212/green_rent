import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+254[17]\d{8}$/, 'Please enter a valid Kenyan phone number (+254...)']
  },

  role: {
    type: String,
    enum: ['tenant', 'landlord', 'admin'],
    required: true,
    default: 'tenant'
  },

  profile: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    avatar: {
      type: String,
      default: null
    },
    dateOfBirth: {
      type: Date,
      required: false
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: false
    },
    nationality: {
      type: String,
      default: 'Kenyan'
    },
    nationalId: {
      type: String,
      unique: true,
      sparse: true
    },
    occupation: String,
    employer: String,

    address: {
      street: String,
      city: String,
      county: String,
      postalCode: String
    },

    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },

  financialProfile: {
    monthlyIncome: {
      type: Number,
      min: 0,
      default: 0
    },
    incomeFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
      default: 'monthly'
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'contract', 'self-employed', 'casual', 'unemployed'],
      default: 'permanent'
    },
    bankName: String,
    accountNumber: String, // Should be encrypted in production
    mpesaNumber: String,
    creditScore: {
      type: Number,
      min: 300,
      max: 850,
      default: 650
    },
    paymentHistory: {
      onTimePayments: {
        type: Number,
        default: 0
      },
      latePayments: {
        type: Number,
        default: 0
      },
      missedPayments: {
        type: Number,
        default: 0
      },
      averagePaymentTime: {
        type: Number,
        default: 0
      }
    }
  },

  documents: [{
    type: {
      type: String,
      enum: ['id', 'passport', 'payslip', 'bank_statement', 'reference', 'other'],
      required: true
    },
    name: String,
    url: String,
    verified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    expiryDate: Date,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'KES'
    },
    searchPreferences: {
      locations: [String],
      minPrice: Number,
      maxPrice: Number,
      propertyTypes: [String]
    }
  },

  verification: {
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    emailVerifiedAt: Date,
    phoneVerified: {
      type: Boolean,
      default: false
    },
    phoneVerificationToken: String,
    phoneVerificationExpires: Date,
    phoneVerifiedAt: Date,
    identityVerified: {
      type: Boolean,
      default: false
    },
    verificationLevel: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      default: 'basic'
    }
  },

  security: {
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    refreshTokens: [{
      token: {
        type: String,
        required: true
      },
      expiresAt: {
        type: Date,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    lastLogin: Date
  },

  subscription: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },

  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'deleted'],
    default: 'active'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.nationalId': 1 }, { sparse: true });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();

  // Hash password with cost of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Update passwordChangedAt on password change
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.security.passwordChangedAt = Date.now() - 1000;
  next();
});

// Method to check if password is correct
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.security.passwordChangedAt) {
    const changedTimestamp = parseInt(this.security.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If lock has expired, reset attempts
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { 'security.loginAttempts': 1 },
      $unset: { 'security.lockUntil': 1 }
    });
  }

  // Otherwise increment attempts
  const updates = { $inc: { 'security.loginAttempts': 1 } };

  // Lock account after 5 failed attempts for 2 hours
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  if (this.security.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { 'security.lockUntil': Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { 'security.loginAttempts': 0 },
    $unset: { 'security.lockUntil': 1 }
  });
};

// Method to update credit score based on payment history
userSchema.methods.updateCreditScore = function() {
  const { onTimePayments, latePayments, missedPayments } = this.financialProfile.paymentHistory;
  const totalPayments = onTimePayments + latePayments + missedPayments;

  if (totalPayments === 0) return;

  const onTimeRate = onTimePayments / totalPayments;
  const missedRate = missedPayments / totalPayments;

  // Simple credit score calculation (can be improved with AI later)
  let score = 650; // Base score

  score += onTimeRate * 200; // Up to +200 for perfect payment history
  score -= missedRate * 300; // Up to -300 for missed payments
  score -= latePayments * 5; // -5 per late payment

  // Clamp between 300 and 850
  this.financialProfile.creditScore = Math.max(300, Math.min(850, Math.round(score)));

  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
