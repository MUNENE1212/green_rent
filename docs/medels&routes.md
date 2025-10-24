# GREENRENT - FEATURE DOCUMENT
## Models & Routes with IntaSend Integration

---

## TABLE OF CONTENTS
1. [Database Models](#database-models)
2. [API Routes](#api-routes)
3. [IntaSend Payment Integration](#intasend-payment-integration)
4. [Webhook Configurations](#webhook-configurations)

---

## DATABASE MODELS

### 1. USER MODEL
**Collection:** `users`

**Key Fields:**
- `_id` - ObjectId (auto)
- `email` - String (unique, required)
- `password` - String (hashed, required)
- `phone` - String (unique, required, format: +254...)
- `role` - Enum: ['tenant', 'landlord', 'admin']

**Nested Objects:**
- `profile` - Personal information (firstName, lastName, avatar, dateOfBirth, gender, nationality, nationalId, occupation, employer, address, emergencyContact)
- `financialProfile` - Income details (monthlyIncome, incomeFrequency, employmentType, bankDetails, mpesaNumber, creditScore, paymentHistory)
- `documents` - Array of uploaded docs (type, name, url, verified, verifiedBy, verifiedAt)
- `preferences` - User settings (notifications, language, currency, searchPreferences)
- `verification` - Verification status (email, phone, identity verification)
- `security` - Auth related (passwordResetToken, loginAttempts, twoFactor)

**Timestamps:** `createdAt`, `updatedAt`, `lastLogin`

**Indexes:**
- email (unique)
- phone (unique)
- role
- nationalId (sparse)
- createdAt

---

### 2. PROPERTY MODEL
**Collection:** `properties`

**Key Fields:**
- `_id` - ObjectId
- `landlordId` - ObjectId (ref: User)
- `name` - String (required)
- `description` - String
- `propertyType` - Enum: ['apartment', 'house', 'studio', 'bedsitter', 'mansion', 'townhouse']
- `status` - Enum: ['active', 'inactive', 'pending_approval', 'maintenance']
- `featured` - Boolean
- `verified` - Boolean

**Nested Objects:**
- `basicInfo` - (name, description, propertyType, yearBuilt, totalUnits, totalFloors, parkingSpaces)
- `location` - Full address (street, area, city, county, postalCode, coordinates {lat, lng}, landmarks)
- `amenities` - Array (name, category, included, additionalCost)
- `utilities` - Water, electricity, internet, gas details (source, included, ratePerUnit, meterType)
- `media` - Array (type, url, thumbnail, caption, isPrimary, order, room, timestamp)
  - **Types:** 'image', 'video', '360_tour', 'floor_plan', 'neighborhood', 'amenity_photo'
  - **Rooms:** 'exterior', 'living_room', 'bedroom', 'kitchen', 'bathroom', 'balcony', 'parking', 'compound'
  - **Minimum Required:** 15 photos (exterior, all rooms, bathroom, kitchen)
  - **Recommended:** 25+ photos + 360° tour + video walkthrough
- `virtualTour` - (enabled: Boolean, provider: String, tourUrl: String, embedCode: String)
- `pricing` - Base price, price range, deposit info, other fees
- `occupancy` - Total units, occupied, available, maintenance, occupancyRate
- `management` - Property manager, caretaker contact
- `settings` - Accepting tenants, deposit required, pets allowed, smoking, minimum lease months, virtualViewingOnly: Boolean

**Performance Metrics:**
- `averageRating` - Number
- `totalReviews` - Number
- `viewCount` - Number
- `inquiryCount` - Number

**Timestamps:** `createdAt`, `updatedAt`

**Indexes:**
- landlordId
- location.coordinates (2dsphere for geospatial)
- status
- propertyType
- featured

---

### 3. UNIT MODEL
**Collection:** `units`

**Key Fields:**
- `_id` - ObjectId
- `propertyId` - ObjectId (ref: Property)
- `unitNumber` - String (required)
- `unitType` - Enum: ['single_room', 'bedsitter', 'studio', 'one_bedroom', 'two_bedroom', 'three_bedroom', 'four_bedroom_plus', 'servant_quarter', 'dsq']
- `floor` - Number
- `bedrooms` - Number (0 for bedsitter, 1+)
- `bathrooms` - Number
- `size` - Number (square meters)
- `basePrice` - Number (required)
- `currentPrice` - Number (AI-adjusted)
- `priceRange` - (minimum: Number, maximum: Number) - for affordability
- `availabilityStatus` - Enum: ['available', 'occupied', 'reserved', 'maintenance']
- `availableFrom` - Date
- `targetTenant` - Enum: ['student', 'young_professional', 'family', 'low_income', 'any'] - helps with matching

**Nested Objects:**
- `features` - Array of strings (balcony, master ensuite, etc.)
- `furnishing` - Type, items list
- `priceHistory` - Array (price, reason, appliedBy, timestamp)
- `utilities` - Meter numbers, inclusion status
- `images` - Array of image objects
  - **Structure:** (url, thumbnail, type, room, order, caption, uploadedAt)
  - **Types:** 'photo', 'video', '360_view', 'floor_plan'
  - **Rooms:** 'living_room', 'master_bedroom', 'bedroom_2', 'kitchen', 'bathroom', 'balcony', 'view'
  - **Minimum Required:** 12 high-quality photos covering all rooms
  - **Quality Standards:** Min resolution 1920x1080, good lighting, clean spaces
- `virtualTour` - (available: Boolean, tourUrl: String, provider: String, views: Number)
- `videoWalkthrough` - (available: Boolean, videoUrl: String, duration: Number, views: Number)
- `mediaCompleteness` - Percentage (calculated: how complete is media coverage)
- `allowVirtualViewingOnly` - Boolean (tenant can apply without physical viewing)

**Timestamps:** `createdAt`, `updatedAt`

**Indexes:**
- propertyId
- availabilityStatus
- currentPrice
- bedrooms

---

### 4. LEASE MODEL
**Collection:** `leases`

**Key Fields:**
- `_id` - ObjectId
- `unitId` - ObjectId (ref: Unit)
- `tenantId` - ObjectId (ref: User)
- `landlordId` - ObjectId (ref: User)
- `leaseNumber` - String (auto-generated, unique)
- `startDate` - Date (required)
- `endDate` - Date (required)
- `monthlyRent` - Number (required)
- `deposit` - Number (required)
- `depositPaid` - Boolean
- `utilitiesIncluded` - Boolean
- `status` - Enum: ['pending', 'active', 'expired', 'terminated', 'renewed']

**Nested Objects:**
- `customTerms` - Array (term, value)
- `documents` - Array (name, url, type, signedAt, signedBy)
- `terminationDetails` - (reason, requestedBy, terminationDate, penaltyAmount)
- `renewalDetails` - (renewedFrom, newEndDate, newRent)

**Timestamps:** `createdAt`, `updatedAt`, `signedAt`, `activatedAt`

**Indexes:**
- unitId
- tenantId
- landlordId
- status
- startDate, endDate

---

### 5. PAYMENT PLAN MODEL
**Collection:** `paymentPlans`

**Key Fields:**
- `_id` - ObjectId
- `leaseId` - ObjectId (ref: Lease)
- `planType` - Enum: ['monthly', 'bi_weekly', 'weekly', 'daily', 'split_monthly', 'custom', 'pay_as_you_earn', 'graduated', 'seasonal', 'micro_savings']
- `totalMonthlyRent` - Number
- `active` - Boolean

**Nested Objects:**
- `schedule` - Array of installments (installmentNumber, amount, dueDate, description, status, paidDate)
- `flexibility` - Settings (allowEarlyPayment, earlyPaymentDiscount, gracePeriodDays, latePaymentFee, allowPartialPayment, allowDailyPayments, allowMicroDeposits)
- `walletIntegration` - (enabled: Boolean, walletId, autoDeductOnDueDate, minimumWalletBalance)
- `autoAdjustment` - AI settings (enabled, basedOn, aiRecommended)
- `landlordSettings` - Payout preferences (minimumMonthlyPayout, acceptsDelayedPayment, maxPaymentSplits, acceptsDailyPayments)
- `performance` - Metrics (onTimePaymentRate, totalPaid, outstanding, walletBalance)

**Timestamps:** `createdAt`, `updatedAt`, `lastModified`

**Indexes:**
- leaseId
- active

---

### 7. RENT WALLET MODEL
**Collection:** `rentWallets`

**Key Fields:**
- `_id` - ObjectId
- `userId` - ObjectId (ref: User)
- `leaseId` - ObjectId (ref: Lease) - optional, can save before having lease
- `walletType` - Enum: ['rent_savings', 'deposit_savings', 'general_savings']
- `balance` - Number (current balance)
- `targetAmount` - Number (monthly rent or deposit amount)
- `autoDeduct` - Boolean (auto-pay rent when target reached)
- `status` - Enum: ['active', 'locked', 'completed', 'closed']

**Nested Objects:**
- `deposits` - Array of micro-deposits
  - (amount, source: ['mpesa', 'card', 'bank', 'salary_deduction'], timestamp, transactionId)
- `withdrawals` - Array (amount, reason, approvedBy, timestamp)
- `autoSaveRules` - Optional automatic savings
  - (enabled: Boolean, frequency: 'daily'|'weekly', amount, dayOfWeek, timeOfDay)
- `milestones` - Track progress
  - (targetReached: Boolean, percentComplete, daysToTarget, projectedCompletionDate)
- `incentives` - Gamification
  - (streakDays: Number, bonusEarned: Number, badges: [])

**Interest/Bonuses:**
- `interestRate` - Small interest on balance (e.g., 0.5% monthly)
- `bonusEarned` - Platform bonuses for consistent saving
- `referralBonus` - Bonus from referrals added to wallet

**Timestamps:** `createdAt`, `updatedAt`, `lastDepositAt`, `targetReachedAt`

**Indexes:**
- userId
- leaseId
- status
- balance

**Business Rules:**
- Any amount can be deposited (minimum KES 10)
- No maximum deposit limit
- Can deposit multiple times per day
- Withdrawals require 24-hour notice (prevent impulsive spending)
- Auto-deduct for rent when balance reaches monthly amount
- Earn small interest (0.5% monthly) to encourage saving
- Earn bonuses for consistent deposits (streak rewards)

---

### 8. PAYMENT MODEL (IntaSend)
**Collection:** `payments`

**Key Fields:**
- `_id` - ObjectId
- `leaseId` - ObjectId (ref: Lease)
- `paymentPlanId` - ObjectId (ref: PaymentPlan)
- `tenantId` - ObjectId (ref: User)
- `landlordId` - ObjectId (ref: User)
- `amount` - Number (required)
- `type` - Enum: ['rent', 'deposit', 'utility', 'maintenance', 'penalty', 'refund', 'wallet_topup', 'micro_deposit']
- `paymentMethod` - Enum: ['mpesa', 'card', 'bank_transfer', 'wallet', 'salary_deduction']
- `walletUsed` - Boolean (if payment came from rent wallet)
- `walletAmount` - Number (amount deducted from wallet)
- `status` - Enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled']

**IntaSend Specific Fields:**
- `intasendInvoiceId` - String (from IntaSend)
- `intasendCheckoutId` - String
- `intasendTrackingId` - String
- `intasendTransactionId` - String
- `intasendPaymentLink` - String

**Nested Objects:**
- `breakdown` - Payment details (baseRent, utilities, otherCharges, discount, total)
- `mpesaDetails` - (phoneNumber, mpesaReceiptNumber, transactionDate)
- `cardDetails` - (last4Digits, cardType, cardBrand) - sensitive data tokenized
- `metadata` - Additional info (ipAddress, userAgent, deviceType)
- `failureDetails` - (errorCode, errorMessage, retryCount, lastRetryAt)

**Dates:**
- `dueDate` - Date
- `initiatedAt` - Date
- `completedAt` - Date
- `failedAt` - Date

**Timestamps:** `createdAt`, `updatedAt`

**Indexes:**
- leaseId
- tenantId
- landlordId
- status
- intasendInvoiceId
- dueDate
- createdAt (for reporting)

---

### 9. PAYOUT MODEL (For Landlords)
**Collection:** `payouts`

**Key Fields:**
- `_id` - ObjectId
- `landlordId` - ObjectId (ref: User)
- `propertyId` - ObjectId (ref: Property)
- `amount` - Number
- `status` - Enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
- `payoutMethod` - Enum: ['mpesa', 'bank_transfer']

**IntaSend Payout Fields:**
- `intasendPayoutId` - String
- `intasendBatchId` - String
- `intasendTrackingId` - String

**Nested Objects:**
- `sourcePayments` - Array of payment IDs that contribute to this payout
- `breakdown` - (totalCollected, platformFee, maintenanceReserve, netPayout)
- `bankDetails` - (bankName, accountNumber, accountName, branch)
- `mpesaDetails` - (phoneNumber, transactionId)
- `failureDetails` - (errorCode, errorMessage, retryCount)

**Dates:**
- `scheduledDate` - Date
- `processedAt` - Date
- `completedAt` - Date

**Timestamps:** `createdAt`, `updatedAt`

**Indexes:**
- landlordId
- status
- scheduledDate

---

### 10. UTILITY READING MODEL
**Collection:** `utilityReadings`

**Key Fields:**
- `_id` - ObjectId
- `unitId` - ObjectId (ref: Unit)
- `leaseId` - ObjectId (ref: Lease)
- `utilityType` - Enum: ['water', 'electricity', 'gas']
- `meterNumber` - String
- `previousReading` - Number
- `currentReading` - Number
- `consumption` - Number (auto-calculated)
- `ratePerUnit` - Number
- `totalCost` - Number (auto-calculated)
- `readingDate` - Date
- `status` - Enum: ['pending', 'verified', 'disputed', 'billed']

**Nested Objects:**
- `billingPeriod` - (startDate, endDate)
- `images` - Array (meterPhoto URLs)
- `verification` - (verifiedBy, verifiedAt, notes)
- `dispute` - (reason, raisedBy, resolvedBy, resolution)

**Timestamps:** `createdAt`, `updatedAt`

**Indexes:**
- unitId
- leaseId
- utilityType
- status
- readingDate

---

### 11. MAINTENANCE REQUEST MODEL
**Collection:** `maintenanceRequests`

**Key Fields:**
- `_id` - ObjectId
- `unitId` - ObjectId (ref: Unit)
- `tenantId` - ObjectId (ref: User)
- `landlordId` - ObjectId (ref: User)
- `requestNumber` - String (auto-generated)
- `category` - Enum: ['plumbing', 'electrical', 'structural', 'appliance', 'pest_control', 'general', 'other']
- `priority` - Enum: ['low', 'medium', 'high', 'emergency']
- `title` - String (required)
- `description` - String (required)
- `status` - Enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold']

**Nested Objects:**
- `images` - Array of image URLs
- `assignedTo` - (vendorId, vendorName, vendorPhone, assignedAt)
- `scheduling` - (scheduledDate, estimatedDuration, actualStartTime, actualEndTime)
- `costing` - (estimatedCost, actualCost, paidBy: ['tenant', 'landlord'])
- `resolution` - (resolutionNotes, completedBy, completionImages)
- `feedback` - (rating, review, reviewDate)

**Timestamps:** `createdAt`, `updatedAt`, `completedAt`

**Indexes:**
- unitId
- tenantId
- landlordId
- status
- priority
- category

---

### 12. NOTIFICATION MODEL
**Collection:** `notifications`

**Key Fields:**
- `_id` - ObjectId
- `userId` - ObjectId (ref: User)
- `type` - Enum: ['payment', 'lease', 'maintenance', 'price_change', 'system', 'message', 'reminder']
- `title` - String (required)
- `message` - String (required)
- `priority` - Enum: ['low', 'normal', 'high', 'urgent']
- `read` - Boolean (default: false)
- `actionUrl` - String
- `actionLabel` - String

**Nested Objects:**
- `data` - Object (additional context/payload)
- `channels` - (email: Boolean, sms: Boolean, push: Boolean, inApp: Boolean)
- `delivery` - (emailSent, smsSent, pushSent, emailSentAt, smsSentAt, pushSentAt)

**Timestamps:** `createdAt`, `readAt`, `expiresAt`

**Indexes:**
- userId
- read
- type
- createdAt

---

### 13. BOOKING/RESERVATION MODEL
**Collection:** `bookings`

**Key Fields:**
- `_id` - ObjectId
- `unitId` - ObjectId (ref: Unit)
- `tenantId` - ObjectId (ref: User)
- `landlordId` - ObjectId (ref: User)
- `bookingNumber` - String (auto-generated, unique)
- `bookingType` - Enum: ['physical_viewing', 'virtual_viewing', 'direct_reservation', 'express_move_in']
- `status` - Enum: ['pending', 'confirmed', 'completed', 'cancelled', 'expired']
- `bookingFee` - Number (optional, for reservations)
- `bookingFeePaid` - Boolean
- `skipPhysicalViewing` - Boolean (tenant opts for virtual-only)

**Nested Objects:**
- `viewingDetails` - (preferredDate, preferredTime, alternativeDates, confirmed: Boolean, confirmedDate, confirmedTime)
- `reservationDetails` - (reservationPeriod: Number in days, expiresAt, autoConvertToLease: Boolean)
- `cancellationDetails` - (cancelledBy, reason, cancelledAt, refundAmount)
- `paymentDetails` - (paymentId, amount, method, paidAt)

**Timestamps:** `createdAt`, `updatedAt`, `expiresAt`, `confirmedAt`

**Indexes:**
- unitId
- tenantId
- status
- bookingType
- expiresAt
- createdAt

**Business Rules:**
- Viewing bookings expire after 7 days if not confirmed
- Reservation holds unit for 3-14 days (configurable)
- Booking fee (typically 10-20% of first month) holds the unit
- Booking fee applied to first payment or refunded if tenant backs out within grace period
- Unit automatically becomes unavailable when reserved
- Expired reservations auto-cancel and release unit

---

### 14. REVIEW MODEL
**Collection:** `reviews`

**Key Fields:**
- `_id` - ObjectId
- `leaseId` - ObjectId (ref: Lease)
- `reviewerRole` - Enum: ['tenant', 'landlord']
- `reviewerId` - ObjectId (ref: User)
- `reviewedId` - ObjectId (ref: User or Property)
- `reviewType` - Enum: ['property', 'tenant', 'landlord']
- `rating` - Number (1-5, required)
- `title` - String
- `comment` - String
- `verified` - Boolean (lease must be completed)

**Nested Objects:**
- `ratings` - Breakdown (cleanliness, communication, value, location, amenities)
- `responses` - Array (responderId, response, respondedAt)
- `helpful` - (upvotes, downvotes)

**Timestamps:** `createdAt`, `updatedAt`

**Indexes:**
- reviewedId
- reviewType
- rating
- verified

---

### 15. AI PRICING MODEL
**Collection:** `aiPricingLogs`

**Key Fields:**
- `_id` - ObjectId
- `unitId` - ObjectId (ref: Unit)
- `modelVersion` - String
- `suggestedPrice` - Number
- `confidence` - Number (0-1)
- `accepted` - Boolean
- `appliedPrice` - Number

**Nested Objects:**
- `inputFeatures` - Object (all features used for prediction)
- `factors` - Array (factor, impact, direction: 'positive'|'negative')
- `marketComparison` - (avgPrice, minPrice, maxPrice, percentilRank)
- `feedback` - (acceptedReason, rejectedReason, manualOverride)

**Timestamps:** `createdAt`, `appliedAt`

**Indexes:**
- unitId
- modelVersion
- createdAt

---

## API ROUTES

### AUTHENTICATION ROUTES
**Base:** `/api/v1/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/logout` | Logout user | Yes |
| POST | `/refresh` | Refresh access token | Yes |
| POST | `/verify-email` | Verify email with OTP | No |
| POST | `/resend-verification` | Resend verification email | No |
| POST | `/verify-phone` | Verify phone with OTP | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| POST | `/change-password` | Change password | Yes |

---

### USER ROUTES
**Base:** `/api/v1/users`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/me` | Get current user profile | Yes | All |
| PUT | `/me` | Update current user profile | Yes | All |
| DELETE | `/me` | Delete account | Yes | All |
| POST | `/me/avatar` | Upload avatar | Yes | All |
| POST | `/me/documents` | Upload KYC documents | Yes | All |
| GET | `/me/documents` | Get user documents | Yes | All |
| DELETE | `/me/documents/:docId` | Delete document | Yes | All |
| PUT | `/me/preferences` | Update preferences | Yes | All |
| GET | `/me/financial-profile` | Get financial profile | Yes | All |
| PUT | `/me/financial-profile` | Update financial profile | Yes | All |
| GET | `/:userId` | Get user by ID | Yes | Admin |
| GET | `/` | Get all users (paginated) | Yes | Admin |
| PUT | `/:userId/verify` | Verify user KYC | Yes | Admin |

---

### PROPERTY ROUTES
**Base:** `/api/v1/properties`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/` | Create property | Yes | Landlord |
| GET | `/` | Get all properties (search, filter) | No | All |
| GET | `/:id` | Get property by ID | No | All |
| PUT | `/:id` | Update property | Yes | Landlord/Admin |
| DELETE | `/:id` | Delete property | Yes | Landlord/Admin |
| POST | `/:id/images` | Upload property images | Yes | Landlord |
| PUT | `/:id/images/:imageId` | Update image metadata | Yes | Landlord |
| DELETE | `/:id/images/:imageId` | Delete property image | Yes | Landlord |
| PUT | `/:id/images/:imageId/primary` | Set primary image | Yes | Landlord |
| POST | `/:id/virtual-tour` | Add virtual tour link | Yes | Landlord |
| POST | `/:id/video-tour` | Upload video walkthrough | Yes | Landlord |
| GET | `/:id/media-gallery` | Get organized media gallery | No | All |
| GET | `/:id/analytics` | Get property analytics | Yes | Landlord/Admin |
| GET | `/landlord/:landlordId` | Get landlord's properties | Yes | Landlord/Admin |
| PUT | `/:id/status` | Update property status | Yes | Admin |
| GET | `/featured` | Get featured properties | No | All |
| POST | `/:id/favorite` | Add to favorites | Yes | Tenant |
| DELETE | `/:id/favorite` | Remove from favorites | Yes | Tenant |
| GET | `/favorites` | Get user favorites | Yes | Tenant |

---

### BOOKING/RESERVATION ROUTES
**Base:** `/api/v1/bookings`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/viewing` | Request unit viewing | Yes | Tenant |
| POST | `/reserve` | Reserve/hold unit | Yes | Tenant |
| GET | `/` | Get all bookings (filtered) | Yes | All |
| GET | `/:id` | Get booking details | Yes | Tenant/Landlord |
| PUT | `/:id/confirm` | Confirm viewing appointment | Yes | Landlord |
| PUT | `/:id/reschedule` | Reschedule viewing | Yes | Tenant/Landlord |
| POST | `/:id/cancel` | Cancel booking | Yes | Tenant/Landlord |
| POST | `/:id/complete` | Mark viewing as completed | Yes | Tenant/Landlord |
| POST | `/:id/convert-to-lease` | Convert reservation to lease | Yes | Landlord |
| GET | `/tenant/:tenantId` | Get tenant bookings | Yes | Tenant/Admin |
| GET | `/unit/:unitId` | Get unit booking history | Yes | Landlord/Admin |
| GET | `/available-slots/:unitId` | Get available viewing slots | No | All |
| POST | `/:id/payment` | Pay booking/reservation fee | Yes | Tenant |

**Booking Flow:**

**Viewing Request:**
1. Tenant browses available units
2. Clicks "Schedule Viewing"
3. Selects preferred date/time
4. Submits request (free)
5. Landlord receives notification
6. Landlord confirms or proposes alternative
7. Viewing happens
8. Both can leave feedback

**Reservation/Hold:**
1. Tenant finds perfect unit
2. Clicks "Reserve This Unit"
3. Pays booking fee (e.g., KES 5,000)
4. Unit marked as "Reserved" for 7 days
5. Tenant completes application
6. Lease created
7. Booking fee applied to first payment
8. If tenant cancels within 48hrs = full refund
9. If after 48hrs = landlord keeps fee
10. If expires = auto-cancelled, fee refunded

---

### UNIT ROUTES
**Base:** `/api/v1/units`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/property/:propertyId` | Create unit | Yes | Landlord |
| GET | `/` | Search units (advanced filters) | No | All |
| GET | `/available` | Get only available units | No | All |
| GET | `/virtual-tour-enabled` | Units with virtual tours | No | All |
| GET | `/:id` | Get unit by ID | No | All |
| GET | `/:id/gallery` | Get complete media gallery | No | All |
| POST | `/:id/images` | Upload unit images | Yes | Landlord |
| PUT | `/:id/images/:imageId` | Update image details | Yes | Landlord |
| DELETE | `/:id/images/:imageId` | Delete image | Yes | Landlord |
| POST | `/:id/virtual-tour` | Add virtual tour | Yes | Landlord |
| POST | `/:id/video` | Upload video walkthrough | Yes | Landlord |
| PUT | `/:id` | Update unit | Yes | Landlord/Admin |
| DELETE | `/:id` | Delete unit | Yes | Landlord/Admin |
| GET | `/:id/availability` | Get availability calendar | No | All |
| GET | `/:id/is-available` | Check real-time availability | No | All |
| PUT | `/:id/price` | Update unit price | Yes | Landlord/Admin |
| GET | `/:id/price-history` | Get price history | Yes | Landlord/Admin |
| POST | `/:id/request-price-update` | Request AI price update | Yes | Landlord |
| GET | `/property/:propertyId` | Get units by property | No | All |
| GET | `/:id/similar` | Get similar available units | No | All |
| POST | `/:id/express-interest` | Express interest (notify landlord) | Yes | Tenant |

---

### LEASE ROUTES
**Base:** `/api/v1/leases`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/` | Create lease | Yes | Landlord |
| GET | `/` | Get all leases (filtered) | Yes | Landlord/Admin |
| GET | `/:id` | Get lease by ID | Yes | Tenant/Landlord/Admin |
| PUT | `/:id` | Update lease | Yes | Landlord/Admin |
| DELETE | `/:id` | Cancel lease | Yes | Landlord/Admin |
| POST | `/:id/sign` | Sign lease (e-signature) | Yes | Tenant |
| POST | `/:id/approve` | Approve lease | Yes | Landlord |
| POST | `/:id/activate` | Activate lease | Yes | Landlord |
| POST | `/:id/renew` | Renew lease | Yes | Tenant/Landlord |
| POST | `/:id/terminate` | Request termination | Yes | Tenant/Landlord |
| GET | `/:id/documents` | Get lease documents | Yes | Tenant/Landlord |
| POST | `/:id/documents` | Upload lease document | Yes | Landlord |
| GET | `/tenant/:tenantId` | Get tenant leases | Yes | Tenant/Admin |
| GET | `/landlord/:landlordId` | Get landlord leases | Yes | Landlord/Admin |
| GET | `/unit/:unitId` | Get unit lease history | Yes | Landlord/Admin |

---

### RENT WALLET ROUTES
**Base:** `/api/v1/wallet`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/create` | Create rent wallet | Yes | Tenant |
| GET | `/me` | Get my wallet(s) | Yes | Tenant |
| GET | `/:id` | Get wallet details | Yes | Tenant |
| POST | `/:id/deposit` | Deposit any amount (min KES 10) | Yes | Tenant |
| POST | `/:id/micro-deposit` | Quick deposit (KES 10, 20, 50, 100) | Yes | Tenant |
| POST | `/:id/bulk-deposit` | Deposit larger amount | Yes | Tenant |
| GET | `/:id/balance` | Check current balance | Yes | Tenant |
| GET | `/:id/history` | Get deposit/withdrawal history | Yes | Tenant |
| PUT | `/:id/auto-save` | Set up auto-save rules | Yes | Tenant |
| PUT | `/:id/target` | Set target amount | Yes | Tenant |
| POST | `/:id/use-for-rent` | Pay rent from wallet | Yes | Tenant |
| GET | `/:id/progress` | Get savings progress | Yes | Tenant |
| GET | `/:id/projections` | Savings projections | Yes | Tenant |
| POST | `/:id/withdraw` | Request withdrawal (24hr notice) | Yes | Tenant |
| GET | `/leaderboard` | Savings leaderboard (gamification) | Yes | All |

**Wallet Features:**

**Micro-Deposits:**
- Deposit as little as KES 10
- No transaction fees on deposits
- Instant credit to wallet
- Multiple deposits per day allowed
- Track all transactions

**Auto-Save Rules:**
```javascript
{
  "enabled": true,
  "frequency": "daily",
  "amount": 100,
  "timeOfDay": "20:00", // 8 PM daily
  "dayOfWeek": null // not applicable for daily
}

// Or weekly
{
  "enabled": true,
  "frequency": "weekly",
  "amount": 500,
  "dayOfWeek": "friday",
  "timeOfDay": "18:00"
}
```

**Savings Incentives:**
- Earn 0.5% monthly interest on balance
- Streak bonuses (save 7 days straight = KES 50 bonus)
- Milestone rewards (50% target = KES 100)
- Referral bonuses added to wallet

**Usage Examples:**

**Example 1: Casual Worker**
```
Monday: Earn KES 800 → Deposit KES 300
Tuesday: Earn KES 600 → Deposit KES 200  
Wednesday: Earn KES 1,000 → Deposit KES 400
Thursday: Earn KES 500 → Deposit KES 150
Friday: Earn KES 900 → Deposit KES 350

Weekly total saved: KES 1,400
Monthly target: KES 5,000 (single room rent)
Progress: 28% after Week 1
```

**Example 2: House Help**
```
Daily salary: KES 400
Daily deposit: KES 100 (automatically)
Monthly target: KES 3,000 (bedsitter)
After 30 days: KES 3,000 saved + KES 15 interest
Can pay rent without stress!
```

---

### PAYMENT PLAN ROUTES
**Base:** `/api/v1/payment-plans`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/recommend` | Get AI-recommended plans (includes daily/wallet options) | Yes | Tenant/Landlord |
| GET | `/available/:unitId` | Get available plans for unit | No | All |
| POST | `/` | Create payment plan | Yes | Tenant/Landlord |
| GET | `/:id` | Get payment plan details | Yes | Tenant/Landlord |
| PUT | `/:id` | Update payment plan | Yes | Tenant/Landlord |
| DELETE | `/:id` | Cancel payment plan | Yes | Landlord/Admin |
| POST | `/:id/adjust` | Request plan adjustment | Yes | Tenant |
| POST | `/:id/approve-adjustment` | Approve adjustment | Yes | Landlord |
| GET | `/lease/:leaseId` | Get plans for lease | Yes | Tenant/Landlord |
| GET | `/:id/schedule` | Get payment schedule | Yes | Tenant/Landlord |

---

### PAYMENT ROUTES (IntaSend Integration)
**Base:** `/api/v1/payments`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/initiate` | Initiate payment | Yes | Tenant |
| POST | `/mpesa` | Process M-Pesa payment | Yes | Tenant |
| POST | `/card` | Process card payment | Yes | Tenant |
| GET | `/:id` | Get payment details | Yes | Tenant/Landlord |
| GET | `/:id/status` | Check payment status | Yes | Tenant/Landlord |
| POST | `/:id/verify` | Verify payment | Yes | System |
| POST | `/:id/retry` | Retry failed payment | Yes | Tenant |
| POST | `/:id/refund` | Initiate refund | Yes | Landlord/Admin |
| GET | `/history` | Get payment history | Yes | Tenant/Landlord |
| GET | `/upcoming` | Get upcoming payments | Yes | Tenant |
| GET | `/overdue` | Get overdue payments | Yes | Tenant/Landlord |
| POST | `/webhook/intasend` | IntaSend webhook | No | System |
| GET | `/receipt/:id` | Download receipt | Yes | Tenant/Landlord |
| GET | `/invoice/:id` | Get invoice | Yes | Tenant/Landlord |
| POST | `/:id/send-reminder` | Send payment reminder | Yes | System/Landlord |

---

### PAYOUT ROUTES
**Base:** `/api/v1/payouts`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/` | Create payout | Yes | System/Admin |
| GET | `/` | Get all payouts | Yes | Admin |
| GET | `/:id` | Get payout details | Yes | Landlord/Admin |
| GET | `/landlord/:landlordId` | Get landlord payouts | Yes | Landlord/Admin |
| GET | `/schedule` | Get payout schedule | Yes | Landlord |
| PUT | `/preferences` | Update payout preferences | Yes | Landlord |
| POST | `/request-advance` | Request advance payout | Yes | Landlord |
| POST | `/:id/process` | Process payout | Yes | System/Admin |
| GET | `/:id/status` | Check payout status | Yes | Landlord/Admin |
| POST | `/webhook/intasend` | IntaSend payout webhook | No | System |

---

### UTILITY ROUTES
**Base:** `/api/v1/utilities`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/readings` | Submit meter reading | Yes | Tenant/Landlord |
| GET | `/readings/:id` | Get reading details | Yes | Tenant/Landlord |
| PUT | `/readings/:id` | Update reading | Yes | Landlord/Admin |
| POST | `/readings/:id/verify` | Verify reading | Yes | Landlord |
| POST | `/readings/:id/dispute` | Dispute reading | Yes | Tenant |
| GET | `/consumption/:unitId` | Get consumption history | Yes | Tenant/Landlord |
| GET | `/bills/:leaseId` | Get utility bills | Yes | Tenant/Landlord |
| POST | `/bills/:id/pay` | Pay utility bill | Yes | Tenant |
| GET | `/unit/:unitId` | Get unit utility info | Yes | Tenant/Landlord |
| GET | `/analytics/:propertyId` | Get utility analytics | Yes | Landlord/Admin |

---

### MAINTENANCE ROUTES
**Base:** `/api/v1/maintenance`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/requests` | Create maintenance request | Yes | Tenant |
| GET | `/requests` | Get all requests (filtered) | Yes | All |
| GET | `/requests/:id` | Get request details | Yes | Tenant/Landlord |
| PUT | `/requests/:id` | Update request | Yes | Landlord/Admin |
| DELETE | `/requests/:id` | Cancel request | Yes | Tenant/Admin |
| PUT | `/requests/:id/status` | Update status | Yes | Landlord/Admin |
| POST | `/requests/:id/assign` | Assign to vendor | Yes | Landlord |
| POST | `/requests/:id/schedule` | Schedule maintenance | Yes | Landlord |
| POST | `/requests/:id/complete` | Mark as complete | Yes | Landlord |
| POST | `/requests/:id/feedback` | Submit feedback | Yes | Tenant |
| GET | `/requests/tenant/:tenantId` | Get tenant requests | Yes | Tenant/Admin |
| GET | `/requests/property/:propertyId` | Get property requests | Yes | Landlord/Admin |

---

### NOTIFICATION ROUTES
**Base:** `/api/v1/notifications`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | Get user notifications | Yes | All |
| GET | `/:id` | Get notification by ID | Yes | All |
| PUT | `/:id/read` | Mark as read | Yes | All |
| PUT | `/read-all` | Mark all as read | Yes | All |
| DELETE | `/:id` | Delete notification | Yes | All |
| DELETE | `/clear` | Clear all notifications | Yes | All |
| GET | `/unread-count` | Get unread count | Yes | All |
| PUT | `/preferences` | Update notification preferences | Yes | All |

---

### REVIEW ROUTES
**Base:** `/api/v1/reviews`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/` | Create review | Yes | Tenant/Landlord |
| GET | `/` | Get all reviews (filtered) | No | All |
| GET | `/:id` | Get review by ID | No | All |
| PUT | `/:id` | Update review | Yes | Reviewer |
| DELETE | `/:id` | Delete review | Yes | Reviewer/Admin |
| POST | `/:id/response` | Respond to review | Yes | Reviewed Party |
| POST | `/:id/helpful` | Mark as helpful | Yes | All |
| GET | `/property/:propertyId` | Get property reviews | No | All |
| GET | `/user/:userId` | Get user reviews | No | All |
| GET | `/me` | Get my reviews | Yes | All |

---

### AI SERVICE ROUTES
**Base:** `/api/v1/ai`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/predict-price` | Get AI price prediction | Yes | Landlord |
| POST | `/recommend-payment-plan` | Get payment plan recommendation | Yes | Tenant/Landlord |
| POST | `/assess-tenant-risk` | Assess tenant risk | Yes | Landlord |
| GET | `/pricing-insights/:unitId` | Get pricing insights | Yes | Landlord |
| POST | `/analyze-market` | Market analysis | Yes | Landlord/Admin |
| GET | `/trends/:area` | Get area trends | Yes | All |
| POST | `/optimize-occupancy` | Occupancy optimization tips | Yes | Landlord |

---

### ANALYTICS ROUTES
**Base:** `/api/v1/analytics`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/dashboard` | Get dashboard metrics | Yes | All |
| GET | `/revenue/:landlordId` | Revenue analytics | Yes | Landlord/Admin |
| GET | `/occupancy/:propertyId` | Occupancy analytics | Yes | Landlord/Admin |
| GET | `/payments/:landlordId` | Payment performance | Yes | Landlord/Admin |
| GET | `/tenant-behavior/:tenantId` | Tenant behavior | Yes | Admin |
| GET | `/market-trends` | Market trends | Yes | All |
| GET | `/property-performance/:propertyId` | Property performance | Yes | Landlord/Admin |
| POST | `/custom-report` | Generate custom report | Yes | Landlord/Admin |
| GET | `/export/:reportId` | Export report | Yes | Landlord/Admin |

---

### ADMIN ROUTES
**Base:** `/api/v1/admin`

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/dashboard` | Admin dashboard | Yes | Admin |
| GET | `/users` | Manage users | Yes | Admin |
| PUT | `/users/:id/status` | Update user status | Yes | Admin |
| GET | `/properties/pending` | Properties pending approval | Yes | Admin |
| PUT | `/properties/:id/approve` | Approve property | Yes | Admin |
| GET | `/payments` | All payments | Yes | Admin |
| GET | `/disputes` | View disputes | Yes | Admin |
| PUT | `/disputes/:id/resolve` | Resolve dispute | Yes | Admin |
| GET | `/reports` | System reports | Yes | Admin |
| POST | `/announcements` | Create announcement | Yes | Admin |
| GET | `/logs` | System logs | Yes | Admin |

---

## INTASEND PAYMENT INTEGRATION

### IntaSend Features Used

1. **Collection API** - For receiving payments
   - M-Pesa STK Push
   - Card payments
   - Bank transfers

2. **Payouts API** - For sending money to landlords
   - M-Pesa B2C
   - Bank transfers

3. **Wallets** - Hold funds temporarily
   - Platform wallet
   - Landlord sub-wallets (optional)

4. **Webhooks** - Real-time notifications
   - Payment status updates
   - Payout confirmations

---

### Payment Flow (Tenant → Platform)

**Step 1: Payment Initiation**
- Tenant clicks "Pay Rent"
- Frontend calls `POST /api/v1/payments/initiate`
- Backend creates payment record with `status: 'pending'`

**Step 2: IntaSend Collection**
```
Backend → IntaSend API:
- For M-Pesa: Create STK Push request
- For Cards: Create checkout session
- Store intasendCheckoutId in payment record
```

**Step 3: User Completes Payment**
- M-Pesa: User enters PIN on phone
- Card: User enters card details on IntaSend page

**Step 4: IntaSend Webhook**
- IntaSend sends notification to `/api/v1/payments/webhook/intasend`
- Backend updates payment status
- Send confirmation notification to tenant
- Update tenant payment history

**Step 5: Post-Payment**
- Generate receipt
- Update lease payment status
- Trigger landlord payout if configured

---

### Payout Flow (Platform → Landlord)

**Step 1: Payout Schedule**
- Based on landlord preferences (immediate, weekly, monthly)
- Automated cron job checks due payouts
- Manual trigger by admin

**Step 2: Payout Creation**
- Calculate net amount (total - fees - reserves)
- Create payout record with `status: 'pending'`

**Step 3: IntaSend Payout**
```
Backend → IntaSend API:
- For M-Pesa: B2C transfer
- For Bank: Bank transfer
- Store intasendPayoutId
```

**Step 4: IntaSend Webhook**
- IntaSend sends payout confirmation
- Update payout status to 'completed'
- Notify landlord

**Step 5: Post-Payout**
- Generate payout receipt
- Update accounting records
- Update landlord balance

---

### IntaSend Configuration

**API Endpoints:**
```
Base URL (Test): https://sandbox.intasend.com/api/v1/
Base URL (Live): https://payment.intasend.com/api/v1/

Collection: /checkout/
Payouts: /payouts/
Wallets: /wallets/
Webhooks: /webhooks/
```

**Authentication:**
- API Key stored in environment variables
- Include in header: `Authorization: Bearer <API_KEY>`

**Webhook Setup:**
- Collection webhook: `https://api.greenrent.co.ke/api/v1/payments/webhook/intasend`
- Payout webhook: `https://api.greenrent.co.ke/api/v1/payouts/webhook/intasend`
- Verify webhook signature for security

---

### Payment Methods Configuration

**M-Pesa:**
```javascript
{
  method: "M-PESA",
  currency: "KES",
  phone_number: "+254712345678",
  amount: 35000,
  api_ref: "GREENRENT-PAYMENT-{paymentId}",
  callback_url: "webhook_url"
}
```

**Card Payment:**
```javascript
{
  method: "CARD",
  currency: "KES",
  amount: 35000,
  api_ref: "GREENRENT-PAYMENT-{paymentId}",
  redirect_url: "https://app.greenrent.co.ke/payment/success",
  callback_url: "webhook_url"
}
```

**Payout:**
```javascript
{
  provider: "MPESA-B2C", // or "BANK"
  currency: "KES",
  amount: 32000,
  account: "+254712345678", // or account number
  narrative: "Rent payout for Property X",
  api_ref: "GREENRENT-PAYOUT-{payoutId}"
}
```

---

### Webhook Payload Examples

**Payment Success:**
```json
{
  "invoice_id": "ABC123",
  "state": "COMPLETE",
  "provider": "M-PESA",
  "charges": 35000,
  "net_amount": 34825,
  "currency": "KES",
  "value": "35000",
  "account": "254712345678",
  "api_ref": "GREENRENT-PAYMENT-12345",
  "mpesa_reference": "QA123ABC",
  "created_at": "2025-10-22T10:30:00Z",
  "updated_at": "2025-10-22T10:30:30Z"
}
```

**Payment Failed:**
```json
{
  "invoice_id": "ABC123",
  "state": "FAILED",
  "failed_reason": "Insufficient balance",
  "api_ref": "GREENRENT-PAYMENT-12345"
}
```

**Payout Completed:**
```json
{
  "tracking_id": "XYZ789",
  "status": "SUCCESS",
  "amount": 32000,
  "account": "254712345678",
  "api_ref": "GREENRENT-PAYOUT-67890",
  "mpesa_reference": "QB456DEF"
}
```

---

### Error Handling

**Payment Errors:**
- Insufficient funds → Retry with smaller amount or different method
- Invalid phone → Validate before submission
- Timeout → Auto-retry after 5 minutes
- User cancelled → Mark as cancelled, allow retry

**Payout Errors:**
- Invalid account → Notify landlord to update details
- Insufficient platform balance → Alert admin
- Network timeout → Auto-retry with exponential backoff

---

### Security Considerations

1. **Webhook Verification**
   - Verify IntaSend signature on all webhooks
   - Check IP whitelist
   - Validate payload structure

2. **API Key Security**
   - Store in environment variables
   - Never expose in frontend
   - Rotate keys quarterly

3. **Payment Validation**
   - Verify amount matches before processing
   - Check duplicate payments (same api_ref)
   - Validate tenant authorization

4. **Data Protection**
   - Never store full card numbers
   - Use IntaSend tokenization
   - Encrypt sensitive payment data
   - PCI-DSS compliance for card handling

---

### Testing Strategy

**Sandbox Testing:**
- Use IntaSend sandbox environment
- Test M-Pesa with sandbox numbers
- Test card with test card numbers
- Test all webhook scenarios

**Test Cases:**
- Successful payment
- Failed payment
- Cancelled payment
- Duplicate payment attempt
- Partial payment
- Refund flow
- Payout success
- Payout failure

---

## WEBHOOK CONFIGURATIONS

### Payment Webhooks

**URL:** `POST /api/v1/payments/webhook/intasend`

**Events:**
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed
- `payment.pending` - Payment initiated
- `payment.cancelled` - User cancelled

**Response:** `200 OK` to acknowledge receipt

---

### Payout Webhooks

**URL:** `POST /api/v1/payouts/webhook/intasend`

**Events:**
- `payout.completed` - Payout successful
- `payout.failed` - Payout failed
- `payout.pending` - Payout processing

**Response:** `200 OK` to acknowledge receipt

---

### Internal Webhooks (Optional)

**SMS Notifications:**
- Via Twilio or Africa's Talking
- Send on payment success/failure
- Send payment reminders

**Email Notifications:**
- Via SendGrid
- Send receipts
- Send invoices
- Send reminders

---

## IMPLEMENTATION PRIORITY

### Phase 1 (MVP - Weeks 1-8)
✅ User Model & Auth Routes
✅ Property Model & Routes
✅ Unit Model & Routes (with availability)
✅ Booking Model & Routes (viewing + reservation)
✅ Lease Model & Routes (basic)
✅ Payment Model & Routes (IntaSend M-Pesa only)
✅ Notification Model & Routes (basic)

### Phase 2 (Weeks 9-12)
✅ Payment Plan Model & Routes
✅ IntaSend Card Payment
✅ Payout Model & Routes
✅ Utility Model & Routes
✅ Maintenance Model & Routes

### Phase 3 (Months 4-6)
✅ Review Model & Routes
✅ AI Pricing Model & Routes
✅ Analytics Routes
✅ Advanced Payment Features

---

## DAILY PAYMENTS & MICRO-SAVINGS SYSTEM

### Financial Inclusion Philosophy

**Core Principle:** "No one should be homeless because they can't save a large amount at once"

**Target Users:**
- Casual workers (daily wage earners)
- Domestic workers (house helps, gardeners, security guards)
- Small business owners (mama mbogas, boda boda riders)
- Students with part-time jobs
- Gig economy workers
- Low-income families

### How It Works

**Traditional Problem:**
- Monthly rent: KES 3,000 (single room)
- Worker earns KES 300-500 per day
- Hard to save KES 3,000 at once
- Temptation to use money for other things
- Miss rent payment → Eviction

**GreenRent Solution:**

**Step 1: Create Rent Wallet**
- Tenant creates wallet
- Sets target (e.g., KES 3,000 for monthly rent)
- Links to M-Pesa for easy deposits

**Step 2: Deposit Anytime, Any Amount**
```
Day 1: Earned KES 400 → Deposit KES 150
Day 2: Earned KES 600 → Deposit KES 300
Day 3: Earned KES 350 → Deposit KES 100
Day 4: Earned KES 500 → Deposit KES 200
Day 5: Earned KES 450 → Deposit KES 150
Day 6: Earned KES 800 → Deposit KES 400
Day 7: Earned KES 300 → Deposit KES 100

Week 1 Total: KES 1,400 saved
Rent due: Day 30
On track? YES! (Already 47% there)
```

**Step 3: Automatic Payment**
- When wallet reaches KES 3,000
- System automatically pays rent
- Or tenant can manually pay
- No stress, no calling landlord

### Payment Plan Options for Low-Income Earners

**1. Daily Payment Plan**
```
Monthly Rent: KES 3,000 (single room)
Daily Amount: KES 100

Every day: Auto-deduct KES 100 from M-Pesa
Deposited to rent wallet
After 30 days: Full rent paid
```

**Benefits:**
- Easy to budget (same as buying lunch)
- Never fall behind
- Build payment history
- Stress-free

**2. Micro-Savings (Flexible)**
```
No fixed schedule
Deposit whenever you have money:
- Morning: KES 50
- Afternoon: KES 30  
- Evening: KES 70
- Total day: KES 150

Platform tracks progress
Sends encouragement notifications
```

**3. Weekly Plan (Structured)**
```
Monthly Rent: KES 4,000 (bedsitter)
Weekly Payment: KES 1,000

Every Friday: Pay KES 1,000
After 4 weeks: Rent covered
```

**4. Hybrid Plan (Smart!)**
```
Wallet + Weekly Payments

Week 1: Deposit KES 800 to wallet
Week 2: Deposit KES 600 to wallet
Week 3: Make payment KES 1,500 (from wallet)
Week 4: Deposit KES 500 to wallet
Week 5: Make payment KES 1,500 (from wallet)

Flexible yet structured
```

### Unit Types for All Income Levels

**Ultra-Affordable Options:**

**1. Single Room (KES 2,000 - 4,000/month)**
- One room for sleeping/living
- Shared bathroom (with 2-3 others)
- Shared kitchen
- Basic amenities
- Perfect for: House helps, students, casual workers

**Daily equivalent: KES 67 - 133**

**2. Bedsitter (KES 3,000 - 8,000/month)**
- One room (bedroom + kitchen in one)
- Private bathroom
- Small cooking area
- Perfect for: Single people, young professionals

**Daily equivalent: KES 100 - 267**

**3. Servant Quarter/DSQ (KES 2,500 - 5,000/month)**
- Small separate structure
- Usually near main house
- Basic facilities
- Perfect for: House helps, security guards

**Daily equivalent: KES 83 - 167**

**4. Studio (KES 6,000 - 15,000/month)**
- Open plan (bedroom/living combined)
- Separate kitchen area
- Private bathroom
- Perfect for: Young professionals, couples

**Daily equivalent: KES 200 - 500**

### Gamification & Incentives

**Savings Streaks:**
- Save 7 days in a row: KES 50 bonus
- Save 14 days in a row: KES 150 bonus
- Save 30 days in a row: KES 300 bonus
- Perfect month: 5% bonus

**Milestones:**
- Reach 25% of target: Badge + KES 50
- Reach 50% of target: Badge + KES 100
- Reach 75% of target: Badge + KES 150
- Reach 100% on time: Badge + KES 200

**Leaderboard:**
- Weekly top savers
- Monthly consistency champions
- Community support and motivation
- No shaming for low amounts (celebrate effort!)

**Interest Earned:**
- 0.5% monthly on wallet balance
- Compounded
- Example: Save KES 3,000 = earn KES 15/month
- Small but motivating

### Withdrawal Protection

**24-Hour Notice Required:**
- Prevents impulsive withdrawals
- Emergency withdrawals: 5% fee
- Protects savings goal
- Can override in true emergency

**Reasons for Withdrawal:**
- Medical emergency (immediate, no fee)
- Family emergency (24 hours)
- Change of plans (24 hours)
- Found better house (24 hours)

### Landlord Benefits (Daily/Micro Plans)

**Why Landlords Should Accept:**

**1. Lower Vacancy**
- Bigger pool of potential tenants
- Fill single rooms and bedsitters faster
- CSR/social impact

**2. Better Collection**
- Money accumulates automatically
- Less chance of default
- Consistent small payments > Large missed payment

**3. Reduced Risk**
- Platform guarantees payment
- Wallet funds are secured
- Landlord gets monthly total regardless

**4. Social Impact**
- Help low-income earners
- Positive reputation
- Government incentives (future)

### Platform Guarantees

**For Tenants:**
- Wallet funds are safe (insured)
- Can always access balance
- No hidden fees on deposits
- Withdrawals allowed with notice

**For Landlords:**
- Get full monthly rent on time
- Platform tops up if wallet short (tenant owes platform)
- No dealing with daily collections
- One monthly payout

### Real-World Scenarios

**Scenario 1: Mary - House Help**
```
Job: House help
Income: KES 12,000/month (paid monthly)
Challenge: Hard to save before payday

Solution:
- Daily auto-save: KES 100
- By end of month: KES 3,000 saved
- Rent paid automatically
- Remaining KES 9,000 for other needs
```

**Scenario 2: John - Boda Boda Rider**
```
Job: Motorcycle taxi
Income: KES 500-800/day (variable)
Challenge: Inconsistent income

Solution:
- Flexible deposits when he earns
- Good day (KES 800): Deposit KES 300
- Bad day (KES 400): Deposit KES 100  
- Target: KES 4,000 bedsitter
- Usually saves by Day 25
- Extra days = buffer for next month
```

**Scenario 3: Grace - Mama Mboga**
```
Job: Vegetable seller
Income: KES 300-600/day
Challenge: Cash always needed for stock

Solution:
- Micro-deposits: 3-4 times per day
- Morning sales: Deposit KES 50
- Lunch time: Deposit KES 30
- Evening: Deposit KES 70
- Total day: KES 150
- Target: KES 3,000 single room
- Saves in 20 days
- Keeps business running
```

### Financial Education Integration

**Built-in Resources:**
- Budgeting tips
- Savings strategies
- How to increase income
- Financial literacy videos
- Success stories

**Notifications:**
- "You're doing great! 50% saved"
- "Only KES 500 more to go!"
- "Payday tomorrow - remember to deposit"
- "You saved 7 days straight - here's KES 50!"

### Social Impact Metrics

**Platform Tracks:**
- Number of low-income earners housed
- Total micro-deposits processed
- Average savings time to rent
- Success stories
- Lives changed

**Reporting:**
- Monthly impact report
- Stories for investors
- Government partnerships
- NGO collaborations

---

## VIRTUAL VIEWING & DIRECT MOVE-IN SYSTEM

### Media Requirements for Landlords

**To Enable Virtual-Only Applications:**

**Minimum Requirements (Must Have):**
1. **15 High-Quality Photos:**
   - Exterior (3 photos: front, side, compound)
   - Living room (2 photos: different angles)
   - Each bedroom (2 photos each)
   - Kitchen (2 photos)
   - Bathroom(s) (2 photos each)
   - Balcony/outdoor space (if applicable)
   - Parking area
   - Building entrance/hallway

**Photo Quality Standards:**
- Resolution: Minimum 1920x1080 pixels
- Lighting: Natural daylight or well-lit
- Cleanliness: Clean, decluttered spaces
- Angles: Wide shots showing full rooms
- Realistic: No heavy filters or editing

**Recommended (Competitive Advantage):**
2. **Video Walkthrough (2-4 minutes):**
   - Start from entrance
   - Walk through all rooms
   - Show amenities
   - Narrate key features
   - Show neighborhood/surroundings

3. **360° Virtual Tour:**
   - Interactive tour of all rooms
   - Can be created with smartphone apps
   - Or professional 360° camera
   - Hosted on platforms like Matterport, Kuula

4. **Additional Media:**
   - Floor plan/layout diagram
   - Neighborhood photos (shops, schools, transport)
   - Amenity photos (gym, playground, parking)
   - View from windows/balcony
   - Security features

---

### Virtual Viewing Experience (Tenant Side)

**Complete Media Gallery Interface:**

```javascript
GET /api/v1/units/:id/gallery

Response:
{
  "unitId": "...",
  "mediaCompleteness": 95, // percentage
  "allowsVirtualBooking": true,
  "photos": {
    "total": 22,
    "byRoom": {
      "exterior": [
        {
          "url": "https://...",
          "thumbnail": "https://...",
          "caption": "Front view of building",
          "order": 1,
          "uploadedAt": "2025-10-20"
        }
      ],
      "living_room": [...],
      "master_bedroom": [...],
      "kitchen": [...],
      "bathroom": [...]
    }
  },
  "videos": [
    {
      "type": "walkthrough",
      "url": "https://...",
      "duration": 180, // seconds
      "thumbnail": "https://...",
      "views": 45
    }
  ],
  "virtualTour": {
    "available": true,
    "provider": "Matterport",
    "url": "https://...",
    "embedCode": "<iframe...>",
    "views": 120
  },
  "floorPlan": {
    "available": true,
    "url": "https://..."
  }
}
```

**Gallery Features:**
- Full-screen image viewer
- Zoom in/out
- Photo carousel/slider
- Room-by-room organization
- Download option (save favorites)
- Share gallery link
- Compare with other properties
- Print-friendly view

---

### Direct Move-In Flow (No Physical Viewing)

**Step 1: Virtual Viewing**
- Tenant browses comprehensive gallery
- Watches video walkthrough
- Takes 360° virtual tour
- Reviews all details thoroughly

**Step 2: Decision to Apply**
- Clicks "Apply Without Viewing" button
- Confirms: "I have reviewed all photos/videos"
- System shows checklist of what was reviewed

**Step 3: Express Reservation**
- Pay booking fee (e.g., KES 7,500 for virtual-only)
- Slightly higher than physical viewing fee (landlord takes more risk)
- Unit immediately reserved

**Step 4: Fast-Track Application**
- Complete application online
- Upload documents
- Digital signature
- Choose payment plan

**Step 5: Remote Approval**
- Landlord reviews application
- May request video call (optional)
- Approves or rejects
- Average turnaround: 24-48 hours

**Step 6: Payment & Key Handover**
- Pay deposit and first installment
- Schedule key collection
- OR keys delivered to tenant
- OR smart lock with digital access code

**Step 7: Move In**
- Tenant moves in
- 7-day inspection period
- If unit doesn't match photos/description:
  - Full refund option
  - Alternative unit offered
  - Complaint resolution process

---

### Protection for Tenants (Virtual Viewing)

**Quality Guarantee:**
- Photos must accurately represent property
- "What you see is what you get" policy
- 7-day inspection period after move-in
- Full refund if property misrepresented

**Verification Badges:**
- "Photos Verified" badge (admin verified photos are recent)
- "Video Verified" badge
- "Virtual Tour Certified" badge
- "Recent Media" indicator (photos < 3 months old)

**Tenant Rights:**
- Request updated photos anytime
- Video call with landlord before committing
- Virtual inspection with landlord via video
- 7-day unconditional exit clause for virtual-only bookings

---

### Benefits for Landlords

**Why Provide Comprehensive Media:**

**1. Fill Units 3x Faster**
- 78% of tenants prefer viewing virtually first
- Reduces time-wasters (only serious tenants visit)
- Expands reach (tenants from other cities can apply)

**2. Wider Tenant Pool**
- People relocating from other cities
- Busy professionals who can't take time off
- International tenants (returning diaspora)
- Students coming from upcountry

**3. Less Hassle**
- Fewer physical viewings to conduct
- No need to be present for every viewing
- Less disruption to current tenants
- Show property 24/7 without being there

**4. Higher Perceived Value**
- Professional presentation
- Modern, tech-savvy landlord image
- Transparency builds trust
- Better quality tenant applications

**5. Premium Pricing**
- Units with virtual tours rent for 5-10% more
- Seen as higher quality
- More competitive listing

---

### Media Upload Support

**GreenRent Provides:**

**Free Services:**
- Photo upload and organization tools
- Basic photo editing (brightness, crop)
- Gallery templates
- Mobile app for photo uploads

**Paid Services:**
- Professional photography: KES 5,000-8,000
  - Professional photographer visits
  - Editing and enhancement
  - Uploaded directly to platform
  
- Video production: KES 8,000-12,000
  - Professional videographer
  - Editing with music/narration
  - 2-3 minute walkthrough
  
- 360° Virtual Tour: KES 10,000-15,000
  - Matterport-style tour
  - Interactive navigation
  - Hosted on platform

**DIY Support:**
- Photo guidelines document
- Video tutorial: "How to photograph your property"
- Recommended smartphone apps
- Lighting tips
- Styling suggestions

---

### Search Filters (Tenant Side)

**Media-Based Filters:**
- Has virtual tour
- Has video walkthrough
- Photo count (15+, 20+, 25+)
- Allows virtual-only booking
- Recently updated photos (< 30 days)
- Verified media badge

**Example:**
```
Search: 2-bedroom in Kilimani
Filters Applied:
✅ Has virtual tour
✅ Allows virtual booking
✅ 20+ photos
✅ Video available

Results: 23 units (sorted by media completeness)
```

---

### Statistics & Analytics

**For Platform:**
- % of bookings that are virtual-only
- Conversion rate: virtual viewers vs physical viewers
- Average time to rent: virtual vs physical
- Tenant satisfaction: virtual vs physical
- Dispute rate comparison

**For Landlords (Dashboard):**
- Gallery views
- Video play count
- Virtual tour interactions
- Photos viewed per session
- Which photos viewed most
- Conversion: views → applications

---

### Mobile App Features

**Offline Gallery Viewing:**
- Download gallery for offline viewing
- Save favorites
- Compare properties offline
- Share via WhatsApp

**AR (Future Enhancement):**
- Point camera at empty room
- See how it would look furnished
- Virtual room measurement
- Furniture placement preview

---

## NOTES
**Routes Used:**
- `GET /api/v1/units/available` - Browse available units
- `GET /api/v1/units?filters` - Search with filters (location, price, bedrooms, etc.)
- `GET /api/v1/properties/:id` - View property details
- `GET /api/v1/units/:id` - View unit details
- `POST /api/v1/properties/:id/favorite` - Save favorites

**User Actions:**
- Browse available units
- Filter by location, price, size, amenities
- View photos and details
- See similar properties
- Save favorites
- Compare options

---

### Stage 2: Viewing (Physical or Virtual)
**Routes Used:**
- `GET /api/v1/units/:id/gallery` - View complete photo gallery
- `GET /api/v1/units/:id` - Access virtual tour/video
- `GET /api/v1/bookings/available-slots/:unitId` - Check viewing slots (if physical)
- `POST /api/v1/bookings/viewing` - Request viewing (physical or virtual)
- `POST /api/v1/units/:id/express-interest` - Quick interest notification

**Option A: Virtual Viewing (Recommended)**
- Browse 15-25 high-quality photos of all rooms
- Watch video walkthrough (2-3 minutes)
- Take 360° virtual tour
- Zoom in on details
- See neighborhood photos
- Check floor plan
- **Decision made from comfort of home**

**Option B: Physical Viewing**
- Schedule appointment
- Visit property
- See in person
- Ask questions

**Tenant Choice:**
- Mark "I prefer virtual viewing only" 
- Or schedule physical viewing
- Or do both (virtual first, then physical if interested)

---

### Stage 3: Reservation (Optional)
**Routes Used:**
- `POST /api/v1/bookings/reserve` - Reserve the unit
- `POST /api/v1/bookings/:id/payment` - Pay booking fee
- `GET /api/v1/bookings/:id` - Check reservation status

**User Actions:**
- Decide to reserve unit
- Pay booking fee (e.g., KES 5,000)
- Unit is held for 7-14 days
- Complete application during hold period

**Business Logic:**
- Unit status changes to "reserved"
- Not visible to other tenants
- Countdown timer starts
- Booking fee held in escrow

---

### Stage 4: Application & Lease
**Routes Used:**
- `POST /api/v1/leases` - Create lease application
- `POST /api/v1/users/me/documents` - Upload required documents
- `POST /api/v1/payment-plans/recommend` - Get payment plan options
- `POST /api/v1/payment-plans` - Select payment plan
- `GET /api/v1/leases/:id` - Check application status

**User Actions:**
- Fill application form
- Upload ID, payslip, etc.
- Choose payment plan
- Review lease terms
- Sign digitally

**Landlord Actions:**
- Review application
- Verify documents
- Approve or reject
- Counter-offer on terms

---

### Stage 5: Payment & Move-In
**Routes Used:**
- `POST /api/v1/payments/initiate` - Pay deposit/first payment
- `GET /api/v1/leases/:id` - Get lease details
- `GET /api/v1/payments/receipt/:id` - Get receipt

**User Actions:**
- Pay deposit (booking fee deducted)
- Pay first month/installment
- Get digital keys/access
- Move in!

**System Actions:**
- Booking fee applied to payment
- Lease activated
- Unit marked as "occupied"
- Welcome notifications sent
- Recurring payments scheduled

---

## UNIT AVAILABILITY SYSTEM

### Availability Statuses

**Available:**
- Unit is vacant and ready to rent
- Visible in all search results
- Can be booked for viewing
- Can be reserved

**Reserved:**
- Tenant paid booking fee
- Not visible in search (or marked "Reserved")
- Cannot be booked by others
- Countdown timer active
- Auto-releases if lease not created

**Occupied:**
- Active lease exists
- Not visible in search
- Cannot be booked
- Shows "Next available: [date]" if lease ending soon

**Maintenance:**
- Undergoing repairs
- Not visible in search
- Cannot be booked
- Shows estimated ready date

**Under Offer:**
- Application submitted, pending approval
- Shown as "Application Pending"
- Others can still express interest (backup)
- Reverts to "Available" if rejected

---

### Real-Time Availability Check

**Endpoint:** `GET /api/v1/units/:id/is-available`

**Response:**
```json
{
  "available": true,
  "status": "available",
  "nextAvailableDate": null,
  "canBookViewing": true,
  "canReserve": true,
  "reservations": {
    "current": 0,
    "pending": 2
  },
  "viewingSlots": [
    "2025-10-25T10:00:00Z",
    "2025-10-25T14:00:00Z",
    "2025-10-26T10:00:00Z"
  ]
}
```

---

### Booking Fee System

**Purpose:**
- Shows tenant is serious
- Compensates landlord for holding unit
- Reduces ghost applications
- Applied to first payment

**Typical Amounts:**
- Studio/Bedsitter: KES 3,000 - 5,000
- 1-Bedroom: KES 5,000 - 7,000
- 2-Bedroom: KES 7,000 - 10,000
- 3-Bedroom+: KES 10,000 - 15,000

**Refund Policy:**
```
Cancel within 24 hours: 100% refund
Cancel within 48 hours: 50% refund
Cancel after 48 hours: No refund (landlord keeps)
Landlord rejects application: 100% refund
Reservation expires unused: 100% refund
```

---

### Smart Features for Tenants

**1. Similar Units Recommendation**
- `GET /api/v1/units/:id/similar`
- When a unit is reserved/occupied, show alternatives
- Based on price, location, size, amenities

**2. Price Alerts**
- Tenant sets preferences
- Notified when units matching criteria become available
- Email + Push notification

**3. Virtual Tours**
- Some properties have 360° photos
- Reduce unnecessary physical viewings
- Filter: `virtualTour=true`

**4. Quick Apply**
- If tenant verified once, reuse documents
- Pre-fill application from profile
- Apply to multiple units simultaneously

**5. Waitlist**
- For popular units
- Get notified if current tenant doesn't renew
- Priority viewing before public listing

---

## NOTES

1. **All routes require proper error handling** with standardized error responses
2. **Rate limiting** should be applied per endpoint type
3. **Input validation** using Joi or Express Validator
4. **Pagination** for all list endpoints (default: 20 items, max: 100)
5. **Search** should support fuzzy matching and filters
6. **File uploads** should validate type, size, and scan for malware
7. **Soft deletes** for most models (set status to 'deleted')
8. **Audit logging** for all critical operations
9. **API versioning** (v1) to allow future changes
10. **Documentation** using Swagger/OpenAPI

---

**This document should be updated as features evolve and new requirements emerge.**