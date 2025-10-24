# GREENRENT - TECHNICAL SPECIFICATION DOCUMENT

## 1. SYSTEM OVERVIEW

### Architecture Type
**Microservices Architecture with Monolithic Start**

We'll begin with a modular monolith for MVP speed, then transition to microservices as we scale.

### High-Level Components

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                      │
│  - Progressive Web App (React/Next.js)              │
│  - Mobile App (React Native - Phase 2)             │
│  - Rent Wallet Interface (Primary Focus)           │
│  - Virtual Tour Viewer                              │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTPS/WSS
                  │
┌─────────────────▼───────────────────────────────────┐
│              API GATEWAY LAYER                       │
│  - Load Balancer (AWS ALB / Nginx)                  │
│  - Rate Limiting (daily micro-transactions)         │
│  - Request Validation                                │
│  - API Authentication                                │
└─────────┬──────────────┬──────────────┬─────────────┘
          │              │              │
          │              │              │
┌─────────▼──────┐ ┌────▼────────┐ ┌──▼──────────────┐
│  Auth Service  │ │  Core API   │ │  AI Service     │
│  (Node.js)     │ │  (Node.js)  │ │  (Python)       │
│                │ │  - Wallet   │ │  - Pricing      │
│                │ │  - Payments │ │  - Matching     │
│                │ │  - Booking  │ │  - Affordability│
└─────────┬──────┘ └────┬────────┘ └──┬──────────────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
          ┌──────────────▼──────────────┐
          │      DATA LAYER              │
          │  - MongoDB (Primary)         │
          │    * Users & Profiles        │
          │    * Rent Wallets            │
          │    * Properties & Units      │
          │    * Bookings & Leases       │
          │    * Payments (all types)    │
          │  - Redis (Cache/Sessions)    │
          │  - S3 (File Storage)         │
          │    * Photos (organized)      │
          │    * Videos                  │
          │    * Virtual Tours           │
          │  - PostgreSQL (Analytics)    │
          │    * Impact Metrics          │
          │    * Wallet Transactions     │
          └──────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│          EXTERNAL SERVICES                            │
│  - IntaSend (Payments: M-Pesa, Cards, Payouts)      │
│  - Twilio/Africa's Talking (SMS)                     │
│  - SendGrid (Email)                                  │
│  - Matterport/Kuula (Virtual Tours)                 │
│  - Google Maps (Location Services)                   │
│  - Cloudinary (Image Optimization)                   │
└──────────────────────────────────────────────────────┘
```

---

## 2. API SPECIFICATIONS

### Base URL
- **Production:** `https://api.greenrent.co.ke/v1`
- **Staging:** `https://api-staging.greenrent.co.ke/v1`
- **Development:** `http://localhost:5000/v1`

### Authentication
**Type:** JWT (JSON Web Tokens)

**Headers:**
```http
Authorization: Bearer <access_token>
X-Refresh-Token: <refresh_token>
```

**Token Structure:**
```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "tenant|landlord|admin",
  "email": "user@example.com",
  "iat": 1635724800,
  "exp": 1635811200
}
```

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2025-10-19T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2025-10-19T10:30:00Z"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## 3. CORE API ENDPOINTS

### Authentication Endpoints

#### POST /auth/register
Register a new user

**Request:**
```json
{
  "email": "tenant@example.com",
  "password": "SecurePass123!",
  "phone": "+254712345678",
  "role": "tenant",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "tenant@example.com",
    "role": "tenant",
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/login
Authenticate user

**Request:**
```json
{
  "email": "tenant@example.com",
  "password": "SecurePass123!"
}
```

**Rate Limit:** 5 requests per minute per IP

#### POST /auth/logout
Invalidate tokens

#### POST /auth/refresh
Refresh access token

#### POST /auth/verify-email
Verify email with OTP

#### POST /auth/reset-password
Reset password flow

---

### User Management Endpoints

#### GET /users/me
Get current user profile

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "tenant@example.com",
    "role": "tenant",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://cdn.greenrent.co.ke/avatars/...",
      "phone": "+254712345678",
      "verified": true
    },
    "financialProfile": {
      "monthlyIncome": 80000,
      "incomeFrequency": "monthly",
      "creditScore": 720
    },
    "createdAt": "2025-01-15T08:00:00Z"
  }
}
```

#### PUT /users/me
Update user profile

#### POST /users/me/documents
Upload KYC documents

**Request:** `multipart/form-data`
```
documentType: "national_id"
file: [binary]
```

#### GET /users/:userId
Get user by ID (Admin only)

---

### Property Management Endpoints

#### POST /properties
Create new property

**Request:**
```json
{
  "name": "Sunrise Apartments",
  "description": "Modern 2-bedroom apartments in Kilimani",
  "propertyType": "apartment",
  "location": {
    "address": {
      "street": "Valley Road",
      "area": "Kilimani",
      "city": "Nairobi",
      "county": "Nairobi",
      "postalCode": "00100"
    },
    "coordinates": {
      "lat": -1.2921,
      "lng": 36.8219
    }
  },
  "totalUnits": 12,
  "amenities": [
    {
      "name": "24/7 Security",
      "category": "security",
      "included": true
    },
    {
      "name": "Backup Generator",
      "category": "utilities",
      "included": true
    }
  ],
  "utilities": {
    "water": {
      "source": "municipal",
      "included": false,
      "ratePerUnit": 53
    },
    "electricity": {
      "provider": "Kenya Power",
      "included": false,
      "ratePerUnit": 24
    }
  }
}
```

**Response:** `201 Created`

#### GET /properties
Get all properties with filters

**Query Parameters:**
- `city` - Filter by city
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `bedrooms` - Number of bedrooms
- `propertyType` - Type of property
- `amenities` - Comma-separated amenities
- `lat` & `lng` & `radius` - Geospatial search
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field (price, createdAt, rating)
- `order` - Sort order (asc, desc)

**Example:**
```
GET /properties?city=Nairobi&minPrice=20000&maxPrice=50000&bedrooms=2&page=1&limit=20&sort=price&order=asc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 98,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET /properties/:id
Get property details

#### PUT /properties/:id
Update property

#### DELETE /properties/:id
Delete property (soft delete)

#### POST /properties/:id/images
Upload property images

#### GET /properties/search
Advanced search with autocomplete

---

### Unit Management Endpoints

#### POST /properties/:propertyId/units
Create unit in property

**Request:**
```json
{
  "unitNumber": "A-101",
  "floor": 1,
  "bedrooms": 2,
  "bathrooms": 2,
  "size": 85,
  "basePrice": 35000,
  "features": ["Balcony", "Master ensuite", "Built-in wardrobes"],
  "availabilityStatus": "available",
  "availableFrom": "2025-11-01"
}
```

#### GET /units/:id
Get unit details

#### PUT /units/:id
Update unit

#### GET /units/:id/availability-calendar
Get 12-month availability calendar

---

### Lease Management Endpoints

#### POST /leases
Create new lease

**Request:**
```json
{
  "unitId": "507f1f77bcf86cd799439011",
  "tenantId": "507f191e810c19729de860ea",
  "startDate": "2025-11-01",
  "endDate": "2026-10-31",
  "monthlyRent": 35000,
  "deposit": 70000,
  "utilitiesIncluded": false,
  "customTerms": [
    {
      "term": "Pet Policy",
      "value": "One small pet allowed with KES 5,000 additional deposit"
    }
  ]
}
```

**Response:** `201 Created`

#### GET /leases/:id
Get lease details

#### PUT /leases/:id
Update lease

#### POST /leases/:id/renew
Renew lease

#### POST /leases/:id/terminate
Terminate lease

#### GET /leases/tenant/:tenantId
Get all leases for tenant

#### GET /leases/landlord/:landlordId
Get all leases for landlord's properties

---

### Payment Plan Endpoints

#### POST /payment-plans/recommend
Get AI-recommended payment plans

**Request:**
```json
{
  "tenantId": "507f191e810c19729de860ea",
  "unitId": "507f1f77bcf86cd799439011",
  "monthlyRent": 35000,
  "tenantProfile": {
    "monthlyIncome": 80000,
    "incomeFrequency": "monthly",
    "paymentHistory": {
      "onTimeRate": 0.95
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "planType": "bi_weekly",
        "name": "Bi-Weekly Payment",
        "aiScore": 92,
        "schedule": [
          {
            "installmentNumber": 1,
            "amount": 17500,
            "dueDate": "2025-11-01",
            "description": "First half of November"
          },
          {
            "installmentNumber": 2,
            "amount": 17500,
            "dueDate": "2025-11-15",
            "description": "Second half of November"
          }
        ],
        "discount": 2,
        "benefits": [
          "Matches your salary schedule",
          "2% discount for consistent payments",
          "Better cash flow management"
        ],
        "riskScore": 12
      }
    ]
  }
}
```

#### POST /payment-plans
Create payment plan

#### GET /payment-plans/:id
Get payment plan details

#### PUT /payment-plans/:id/adjust
Request payment plan adjustment

---

### Payment Processing Endpoints

#### POST /payments/initiate
Initiate payment

**Request:**
```json
{
  "leaseId": "507f1f77bcf86cd799439011",
  "amount": 17500,
  "paymentMethod": "mpesa",
  "phone": "+254712345678",
  "description": "Rent payment - November 2025"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "507f1f77bcf86cd799439012",
    "status": "pending",
    "checkoutRequestId": "ws_CO_191220251030...",
    "message": "Payment request sent to your phone"
  }
}
```

#### POST /payments/callback/mpesa
M-Pesa callback (webhook)

#### GET /payments/:id
Get payment status

#### GET /payments/history
Get payment history

**Query Parameters:**
- `userId` - Filter by user
- `leaseId` - Filter by lease
- `status` - Filter by status
- `startDate` - From date
- `endDate` - To date
- `page` - Page number
- `limit` - Items per page

#### POST /payments/retry
Retry failed payment

---

### Utility Management Endpoints

#### POST /utilities/readings
Submit meter reading

**Request:**
```json
{
  "unitId": "507f1f77bcf86cd799439011",
  "utilityType": "water",
  "currentReading": 1234.5,
  "readingDate": "2025-10-19",
  "imageUrl": "https://s3.../meter-reading.jpg"
}
```

#### GET /utilities/consumption/:unitId
Get consumption history

#### GET /utilities/bills/:leaseId
Get utility bills for lease

---

### Maintenance Endpoints

#### POST /maintenance/requests
Submit maintenance request

**Request:**
```json
{
  "unitId": "507f1f77bcf86cd799439011",
  "category": "plumbing",
  "priority": "high",
  "description": "Kitchen sink leaking",
  "images": [
    "https://s3.../issue1.jpg",
    "https://s3.../issue2.jpg"
  ]
}
```

#### GET /maintenance/requests/:id
Get maintenance request

#### PUT /maintenance/requests/:id/status
Update maintenance status

---

### AI Service Endpoints

#### POST /ai/predict-price
Predict optimal price for unit

**Request:**
```json
{
  "unitId": "507f1f77bcf86cd799439011",
  "features": {
    "bedrooms": 2,
    "bathrooms": 2,
    "size": 85,
    "location": {
      "lat": -1.2921,
      "lng": 36.8219
    },
    "amenities": ["Security", "Parking", "Generator"],
    "yearBuilt": 2020,
    "floor": 3
  },
  "marketData": {
    "avgPriceInArea": 38000,
    "demandIndex": 0.75,
    "seasonality": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestedPrice": 36500,
    "confidence": 0.87,
    "priceRange": {
      "min": 34000,
      "max": 39000
    },
    "factors": [
      {
        "factor": "Location",
        "impact": 25,
        "direction": "positive"
      },
      {
        "factor": "Demand",
        "impact": 15,
        "direction": "positive"
      }
    ],
    "comparison": {
      "marketAverage": 38000,
      "percentageDifference": -3.95
    }
  }
}
```

---

## 4. DATABASE SCHEMAS (DETAILED)

**Note:** Complete database schemas with all new features (Rent Wallet, Booking/Reservation, Enhanced Media, etc.) are documented in the "Complete Models & Routes with IntaSend Integration" feature document. Key enhancements include:

**New Collections Added:**
- **rentWallets** - Micro-savings and daily deposit tracking
- **bookings** - Viewing requests and reservations
- Enhanced **payments** - Wallet integration, micro-deposits
- Enhanced **units** - All housing types, comprehensive media, virtual tour links
- Enhanced **properties** - Room-by-room photo organization

**Key Schema Updates:**
- User: Added financial profile with income frequency patterns
- Unit: Added unitType (single_room, bedsitter, dsq, etc.), targetTenant, comprehensive media arrays
- Payment Plan: Added daily/micro-savings options, wallet integration
- Payment: Added wallet_topup, micro_deposit types

### Users Collection (Enhanced)

```javascript
{
  _id: ObjectId,
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: emailValidator
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't return in queries
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    validate: phoneValidator
  },
  role: {
    type: String,
    enum: ['tenant', 'landlord', 'admin'],
    required: true
  },
  
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: { type: String, default: null },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    nationality: { type: String, default: 'Kenyan' },
    nationalId: { type: String, unique: true, sparse: true },
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
    monthlyIncome: { type: Number, min: 0 },
    incomeFrequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly'],
      default: 'monthly'
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'contract', 'self-employed']
    },
    bankName: String,
    accountNumber: String, // Encrypted
    mpesaNumber: String,
    creditScore: {
      type: Number,
      min: 300,
      max: 850,
      default: 650
    },
    paymentHistory: {
      onTimePayments: { type: Number, default: 0 },
      latePayments: { type: Number, default: 0 },
      missedPayments: { type: Number, default: 0 },
      averagePaymentTime: { type: Number, default: 0 } // Days
    }
  },
  
  documents: [{
    type: {
      type: String,
      enum: ['id', 'passport', 'payslip', 'bank_statement', 'reference']
    },
    name: String,
    url: String,
    verified: { type: Boolean, default: false },
    verifiedBy: { type: ObjectId, ref: 'User' },
    verifiedAt: Date,
    expiryDate: Date,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'KES' }
  },
  
  verification: {
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    phoneVerified: { type: Boolean, default: false },
    phoneVerificationToken: String,
    phoneVerificationExpires: Date,
    identityVerified: { type: Boolean, default: false },
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
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String
  },
  
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'deleted'],
    default: 'active'
  },
  
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ "profile.nationalId": 1 }, { sparse: true })
db.users.createIndex({ status: 1 })
db.users.createIndex({ createdAt: -1 })
```

---

## 5. SECURITY SPECIFICATIONS

### Password Policy
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Cannot contain email or phone number
- Hashed using bcrypt (cost factor: 12)

### API Rate Limiting

| Endpoint Type | Rate Limit |
|--------------|-----------|
| Authentication | 5 req/min per IP |
| Public APIs | 100 req/min per IP |
| Authenticated APIs | 1000 req/hour per user |
| Payment APIs | 10 req/min per user |
| File Upload | 20 req/hour per user |

### Data Encryption
- **In Transit:** TLS 1.3
- **At Rest:** AES-256
- **Sensitive Fields:** 
  - Password (bcrypt)
  - National ID (AES-256)
  - Bank account (AES-256)
  - Payment info (tokenized)

### CORS Configuration
```javascript
{
  origin: [
    'https://greenrent.co.ke',
    'https://www.greenrent.co.ke',
    'https://app.greenrent.co.ke'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token']
}
```

---

## 6. PERFORMANCE REQUIREMENTS

### Response Time Targets
- API Response: < 200ms (95th percentile)
- Page Load: < 2 seconds (initial)
- Search Results: < 500ms
- Payment Processing: < 3 seconds

### Scalability Targets
- Support 10,000 concurrent users
- Handle 1,000 req/second
- Store 1M+ properties
- Process 10,000 payments/day

### Availability
- Uptime: 99.9% (8.76 hours downtime/year)
- Planned maintenance: < 4 hours/month
- Recovery Time Objective (RTO): 1 hour
- Recovery Point Objective (RPO): 15 minutes

---

## 7. MONITORING & LOGGING

### Metrics to Track
- Request count per endpoint
- Response time (p50, p95, p99)
- Error rate by type
- Database query performance
- Cache hit ratio
- Payment success rate
- User signup conversion
- Active users (DAU/MAU)

### Logging Levels
- **ERROR:** System failures, exceptions
- **WARN:** Deprecated features, slow queries
- **INFO:** User actions, API calls
- **DEBUG:** Development debugging

### Alert Conditions
- Error rate > 1%
- Response time > 1 second
- CPU usage > 80%
- Memory usage > 85%
- Disk usage > 90%
- Payment failure rate > 5%

---

## 8. TESTING STRATEGY

### Unit Testing
- Coverage target: > 80%
- Tools: Jest, Mocha
- Run on every commit

### Integration Testing
- API endpoint testing
- Database integration
- Third-party service mocks
- Run before deployment

### End-to-End Testing
- Critical user flows
- Tools: Cypress, Playwright
- Run before release

### Load Testing
- Tools: k6, Artillery
- Simulate 10,000 concurrent users
- Run monthly

### Security Testing
- OWASP Top 10 checks
- Dependency vulnerability scans
- Penetration testing (quarterly)

---

## 8. RENT WALLET TECHNICAL SPECIFICATIONS

### Critical Requirements

**Transaction Consistency:**
- ACID compliance for all wallet operations
- Double-entry bookkeeping
- Transaction logs immutable
- Real-time balance calculation
- Atomic operations (no partial deposits)

**Performance:**
- Wallet balance check: < 50ms
- Deposit operation: < 100ms
- Concurrent deposits: Support 1000/second
- Balance history query: < 200ms

**Security:**
- End-to-end encryption for amounts
- Multi-factor authentication for withdrawals
- Fraud detection (unusual patterns)
- Rate limiting (max 50 deposits/day per user)
- Audit trail for all operations

### Deposit Flow (Micro-Transaction)

```javascript
// Optimized for speed and reliability
async function processMicroDeposit(userId, amount, source) {
  // 1. Validate (< 10ms)
  if (amount < 10) throw new Error('Minimum KES 10');
  if (amount > 50000) throw new Error('Maximum KES 50,000 per deposit');
  
  // 2. Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 3. Record in payments collection
    const payment = await Payment.create([{
      userId,
      amount,
      type: 'wallet_topup',
      source,
      status: 'processing'
    }], { session });
    
    // 4. Update wallet (atomic operation)
    const wallet = await RentWallet.findOneAndUpdate(
      { userId, status: 'active' },
      { 
        $inc: { balance: amount },
        $push: { 
          deposits: {
            amount,
            source,
            timestamp: new Date(),
            transactionId: payment[0]._id
          }
        },
        $set: { lastDepositAt: new Date() }
      },
      { session, new: true }
    );
    
    // 5. Update user streak/gamification
    await updateUserStreak(userId, session);
    
    // 6. Check if target reached
    if (wallet.balance >= wallet.targetAmount && wallet.autoDeduct) {
      await triggerRentPayment(wallet, session);
    }
    
    // 7. Calculate interest
    await calculateInterest(wallet, session);
    
    // 8. Commit transaction
    await session.commitTransaction();
    
    // 9. Async notifications (non-blocking)
    notifyDeposit(userId, amount, wallet.balance).catch(err => logError(err));
    
    // 10. Update analytics (non-blocking)
    trackWalletActivity(userId, 'deposit', amount).catch(err => logError(err));
    
    return { success: true, balance: wallet.balance, transactionId: payment[0]._id };
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### Interest Calculation

```javascript
// Monthly interest: 0.5% for free tier, 1% for premium
// Calculated daily, credited monthly

async function calculateInterest(wallet, session) {
  const now = new Date();
  const lastCalc = wallet.lastInterestCalculation || wallet.createdAt;
  const daysSinceLastCalc = (now - lastCalc) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastCalc >= 30) {
    const user = await User.findById(wallet.userId);
    const rate = user.subscription === 'premium' ? 0.01 : 0.005; // 1% or 0.5%
    const interest = wallet.balance * rate;
    
    await RentWallet.findByIdAndUpdate(
      wallet._id,
      {
        $inc: { 
          balance: interest,
          bonusEarned: interest
        },
        $set: { lastInterestCalculation: now }
      },
      { session }
    );
    
    // Notify user
    await Notification.create([{
      userId: wallet.userId,
      type: 'wallet',
      title: 'Interest Earned!',
      message: `You earned KES ${interest.toFixed(2)} in interest`,
      data: { amount: interest, type: 'interest' }
    }], { session });
  }
}
```

### Auto-Save Rules Implementation

```javascript
// Cron job runs every hour checking for due auto-saves
async function processAutoSaveRules() {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Find wallets with active auto-save rules
  const walletsWithRules = await RentWallet.find({
    'autoSaveRules.enabled': true,
    status: 'active'
  });
  
  for (const wallet of walletsWithRules) {
    const rule = wallet.autoSaveRules;
    let shouldExecute = false;
    
    // Check if it's time to execute
    if (rule.frequency === 'daily' && hour === parseInt(rule.timeOfDay)) {
      shouldExecute = true;
    } else if (rule.frequency === 'weekly' && 
               dayOfWeek === rule.dayOfWeek && 
               hour === parseInt(rule.timeOfDay)) {
      shouldExecute = true;
    }
    
    if (shouldExecute) {
      try {
        // Initiate M-Pesa STK Push
        await initiateAutoDeposit(wallet.userId, rule.amount);
      } catch (error) {
        // Log error, notify user
        await notifyAutoSaveFailed(wallet.userId, error.message);
      }
    }
  }
}
```

### Gamification Streak Calculation

```javascript
async function updateUserStreak(userId, session) {
  const wallet = await RentWallet.findOne({ userId }, null, { session });
  const today = new Date().setHours(0, 0, 0, 0);
  const lastDeposit = new Date(wallet.lastDepositAt).setHours(0, 0, 0, 0);
  const daysDiff = (today - lastDeposit) / (1000 * 60 * 60 * 24);
  
  let streakDays = wallet.incentives?.streakDays || 0;
  let bonusEarned = wallet.incentives?.bonusEarned || 0;
  
  if (daysDiff === 1) {
    // Consecutive day
    streakDays++;
    
    // Award bonuses at milestones
    if (streakDays === 7) {
      bonusEarned = 50;
      await creditBonus(wallet, 50, '7-day streak bonus!', session);
    } else if (streakDays === 14) {
      bonusEarned = 150;
      await creditBonus(wallet, 150, '14-day streak bonus!', session);
    } else if (streakDays === 30) {
      bonusEarned = 300;
      await creditBonus(wallet, 300, 'Perfect month bonus!', session);
    }
  } else if (daysDiff > 1) {
    // Streak broken
    streakDays = 1;
  }
  
  await RentWallet.findByIdAndUpdate(
    wallet._id,
    {
      $set: {
        'incentives.streakDays': streakDays,
        'incentives.bonusEarned': bonusEarned
      }
    },
    { session }
  );
}
```

### Withdrawal Protection

```javascript
async function requestWithdrawal(userId, amount, reason) {
  const wallet = await RentWallet.findOne({ userId, status: 'active' });
  
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  const isEmergency = reason === 'medical_emergency';
  const processingTime = isEmergency ? 0 : 24 * 60 * 60 * 1000; // 0 or 24 hours
  const fee = isEmergency ? amount * 0.05 : 0; // 5% fee for emergency
  const netAmount = amount - fee;
  
  const withdrawal = await Withdrawal.create({
    userId,
    walletId: wallet._id,
    amount,
    fee,
    netAmount,
    reason,
    isEmergency,
    status: 'pending',
    processAfter: new Date(Date.now() + processingTime)
  });
  
  // Lock the amount in wallet
  await RentWallet.findByIdAndUpdate(wallet._id, {
    $inc: { 
      balance: -amount,
      lockedBalance: amount
    }
  });
  
  // Send notification
  await Notification.create({
    userId,
    type: 'wallet',
    title: isEmergency ? 'Emergency Withdrawal Processing' : 'Withdrawal Requested',
    message: isEmergency 
      ? `KES ${netAmount} will be processed immediately (5% fee applied)`
      : `KES ${amount} will be available in 24 hours`
  });
  
  return withdrawal;
}
```

### Fraud Detection

```javascript
// Real-time fraud detection
async function detectFraud(userId, amount, source) {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Get recent deposits
  const recentDeposits = await Payment.find({
    userId,
    type: 'wallet_topup',
    createdAt: { $gte: last24h }
  });
  
  const depositCount = recentDeposits.length;
  const totalAmount = recentDeposits.reduce((sum, p) => sum + p.amount, 0);
  
  // Fraud indicators
  const indicators = [];
  
  if (depositCount > 50) {
    indicators.push('excessive_transactions');
  }
  
  if (totalAmount > 100000) {
    indicators.push('high_volume');
  }
  
  if (amount > 50000) {
    indicators.push('large_single_transaction');
  }
  
  // Check for rapid successive deposits (< 5 seconds apart)
  if (recentDeposits.length > 0) {
    const lastDeposit = recentDeposits[recentDeposits.length - 1];
    const timeDiff = Date.now() - lastDeposit.createdAt;
    if (timeDiff < 5000) {
      indicators.push('rapid_succession');
    }
  }
  
  if (indicators.length >= 2) {
    // Flag for review, but don't block (avoid false positives for low-income users)
    await FraudAlert.create({
      userId,
      indicators,
      amount,
      timestamp: new Date(),
      status: 'review_required'
    });
    
    // Notify admin
    await notifyAdmin('fraud_alert', { userId, indicators, amount });
  }
}
```

---

## 9. DEPLOYMENT STRATEGY

### Environments
1. **Development:** Latest code, frequent updates
2. **Staging:** Pre-production testing
3. **Production:** Live system

### CI/CD Pipeline
```
Code Push → Unit Tests → Build → Integration Tests → 
Staging Deploy → E2E Tests → Manual Approval → 
Production Deploy → Smoke Tests → Monitor
```

### Rollback Procedure
1. Detect issue (monitoring alerts)
2. Stop new deployments
3. Route traffic to previous version
4. Investigate root cause
5. Fix and redeploy

---

This technical specification serves as the blueprint for development. Update it as the system evolves and new requirements emerge.