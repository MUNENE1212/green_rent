# GreenRent Database Models

This directory contains all Mongoose models for the GreenRent application.

## Models Overview

### 1. User Model (`User.model.js`)
**Collection**: `users`

Handles user authentication, profiles, and financial information.

**Key Features**:
- Multi-role support (tenant, landlord, admin)
- Password hashing with bcrypt
- Financial profile with income tracking
- Credit score calculation
- Document verification (KYC)
- Login attempt tracking and account locking
- Email/Phone verification

**Important Methods**:
- `comparePassword(candidatePassword)` - Check password
- `updateCreditScore()` - Update credit score based on payment history
- `incLoginAttempts()` - Increment failed login attempts
- `resetLoginAttempts()` - Reset login attempts on successful login

### 2. Property Model (`Property.model.js`)
**Collection**: `properties`

Manages rental properties with comprehensive details.

**Key Features**:
- Location with geospatial coordinates (2dsphere index)
- Amenities and utilities configuration
- Media gallery (photos, videos, virtual tours)
- Pricing and occupancy tracking
- Performance metrics (views, inquiries, ratings)

**Important Methods**:
- `updateOccupancyRate()` - Calculate and update occupancy
- `getMediaCompleteness()` - Calculate media quality score
- `incrementViewCount()` - Track property views
- `setPrimaryImage(imageId)` - Set main property image

### 3. Unit Model (`Unit.model.js`)
**Collection**: `units`

Individual rental units within properties.

**Key Features**:
- Multiple unit types (single_room, bedsitter, studio, 1-4 bedrooms, DSQ)
- Virtual viewing support (photos, videos, 360° tours)
- Media completeness tracking
- Affordability calculations (daily, weekly, monthly)
- Target tenant matching

**Important Methods**:
- `isAvailable()` - Check availability
- `reserve(tenantId)` - Reserve unit
- `occupy(tenantId, leaseId)` - Mark as occupied
- `vacate()` - Mark as available
- `getAffordabilityBreakdown()` - Calculate payment options

**Static Methods**:
- `findAffordableUnits(maxDailyBudget)` - Find units within budget
- `findUnitsWithVirtualTours()` - Find units with comprehensive media

### 4. RentWallet Model (`RentWallet.model.js`)
**Collection**: `rentWallets`

Micro-savings wallet for tenants to save rent gradually.

**Key Features**:
- Minimum deposit: KES 10
- Multiple deposits per day
- Auto-save rules (daily, weekly)
- Streak tracking and gamification
- Interest calculation (0.5% - 1% monthly)
- Milestone bonuses
- Withdrawal protection (24-hour notice)

**Important Methods**:
- `deposit(amount, source, transactionId)` - Add money to wallet
- `requestWithdrawal(amount, reason)` - Request withdrawal
- `completeWithdrawal(withdrawalId)` - Process withdrawal
- `updateStreak()` - Update consecutive deposit streak
- `checkMilestoneBonuses()` - Award bonuses at milestones
- `calculateInterest()` - Calculate monthly interest
- `payRentFromWallet(amount, leaseId)` - Pay rent from wallet

**Static Methods**:
- `getTopSavers(limit, period)` - Leaderboard for gamification

### 5. Lease Model (`Lease.model.js`)
**Collection**: `leases`

Rental agreements between tenants and landlords.

**Key Features**:
- Digital signatures (tenant and landlord)
- Move-in/move-out inspections
- Custom terms and conditions
- Auto-renewal support
- Payment tracking
- Termination with penalties

**Important Methods**:
- `sign(userId, role, signature)` - Sign lease
- `activate()` - Activate signed lease
- `terminate(terminatedBy, reason)` - End lease
- `renew(newEndDate, newRent)` - Renew lease
- `updatePaymentSummary()` - Update payment status
- `isActive()` - Check if lease is active
- `isExpiringSoon(days)` - Check if expiring

**Static Methods**:
- `findExpiringLeases(days)` - Find leases expiring soon
- `findOverdueLeases()` - Find leases with overdue payments

### 6. Payment Model (`Payment.model.js`)
**Collection**: `payments`

All payment transactions in the system.

**Key Features**:
- Multiple payment types (rent, deposit, utility, wallet_topup, etc.)
- IntaSend integration fields
- M-Pesa, Card, Bank transfer support
- Wallet payment integration
- Automatic fee calculation
- Refund processing
- Retry mechanism for failed payments

**Important Methods**:
- `markAsCompleted(transactionData)` - Mark payment as successful
- `markAsFailed(errorCode, errorMessage)` - Mark as failed
- `retry()` - Retry failed payment
- `processRefund(amount, reason)` - Process refund

**Static Methods**:
- `getStatistics(userId, role, period)` - Payment statistics
- `findOverduePayments()` - Find overdue payments

### 7. PaymentPlan Model (`PaymentPlan.model.js`)
**Collection**: `paymentPlans`

Flexible payment schedules for leases.

**Key Features**:
- Multiple plan types (monthly, bi-weekly, weekly, daily, micro-savings)
- Auto-generated payment schedules
- Wallet integration support
- Grace periods and late fees
- Early payment discounts
- Performance tracking

**Important Methods**:
- `generateSchedule()` - Create payment schedule
- `markInstallmentPaid(installmentNumber, paymentId)` - Mark as paid
- `getTotalOutstanding()` - Calculate remaining amount
- `getOverdueInstallments()` - Find overdue payments
- `updateOverdueStatus()` - Update overdue status
- `adjustBasedOnHistory()` - AI-based plan adjustment

**Static Methods**:
- `getRecommendedPlan(monthlyRent, incomeFrequency)` - AI recommendation

### 8. Booking Model (`Booking.model.js`)
**Collection**: `bookings`

Viewing appointments and unit reservations.

**Key Features**:
- Physical and virtual viewing options
- Direct reservations with booking fee
- Express move-in (skip viewing)
- Automatic expiry
- Refund policy (24hr: 100%, 48hr: 50%)
- Virtual viewing tracking

**Important Methods**:
- `confirmViewing(date, time, location)` - Confirm appointment
- `completeViewing()` - Mark viewing as done
- `reserve()` - Reserve unit
- `cancel(cancelledBy, reason)` - Cancel booking
- `convertToLease(leaseData)` - Convert to lease
- `trackVirtualViewing(data)` - Track virtual viewing activity

**Static Methods**:
- `findExpiringReservations(hours)` - Find expiring soon
- `expireOldReservations()` - Expire and release units (cron job)

### 9. Notification Model (`Notification.model.js`)
**Collection**: `notifications`

User notifications across multiple channels.

**Key Features**:
- Multiple notification types
- Multi-channel delivery (email, SMS, push, in-app)
- Priority levels
- Read/unread tracking
- Auto-expiry (TTL index)
- Delivery status tracking

**Important Methods**:
- `markAsRead()` - Mark as read
- `sendEmail(user)` - Send email notification
- `sendSMS(user)` - Send SMS notification
- `sendPush(user)` - Send push notification

**Static Methods**:
- `createAndSend(notificationData)` - Create and send
- `markAllAsRead(userId)` - Mark all as read
- `getUnreadCount(userId)` - Get unread count
- `deleteOldNotifications(days)` - Cleanup old notifications

### 10. UtilityReading Model (`UtilityReading.model.js`)
**Collection**: `utilityReadings`

Utility meter readings and billing.

**Key Features**:
- Water, electricity, gas tracking
- Automatic consumption calculation
- Image upload for meter photos
- Dispute resolution
- Billing integration

**Important Methods**:
- `verify(verifiedBy, notes)` - Verify reading
- `disputeReading(raisedBy, reason)` - Dispute reading
- `resolveDispute(resolvedBy, resolution)` - Resolve dispute

**Static Methods**:
- `getConsumptionHistory(unitId, utilityType, months)` - Get history
- `getAverageConsumption(unitId, utilityType, months)` - Calculate average

### 11. MaintenanceRequest Model (`MaintenanceRequest.model.js`)
**Collection**: `maintenancerequests`

Maintenance and repair requests.

**Key Features**:
- Multiple categories (plumbing, electrical, etc.)
- Priority levels (low, medium, high, emergency)
- Vendor assignment
- Scheduling and tracking
- Cost estimation and invoicing
- Feedback and ratings
- Warranty tracking

**Important Methods**:
- `acknowledge(acknowledgedBy)` - Acknowledge request
- `assign(vendorData, assignedBy)` - Assign to vendor
- `schedule(date, time, duration)` - Schedule work
- `startWork()` - Mark as in progress
- `complete(resolutionData)` - Mark as completed
- `cancel(reason)` - Cancel request
- `addComment(from, message)` - Add comment
- `submitFeedback(rating, review)` - Submit feedback

**Static Methods**:
- `getPendingByPriority(landlordId)` - Get pending sorted by priority
- `getOverdueRequests()` - Get overdue maintenance
- `getStatistics(unitId, months)` - Get maintenance statistics

## Model Relationships

```
User
├── Properties (landlord)
├── Units (current tenant)
├── Leases (tenant/landlord)
├── Payments (tenant/landlord)
├── RentWallets (tenant)
├── Bookings (tenant)
└── Notifications

Property
├── Units (one-to-many)
└── Landlord (User)

Unit
├── Property (belongs to)
├── CurrentTenant (User)
├── CurrentLease (Lease)
├── Bookings (one-to-many)
└── MaintenanceRequests (one-to-many)

Lease
├── Unit
├── Tenant (User)
├── Landlord (User)
├── PaymentPlan (one-to-one)
├── Payments (one-to-many)
└── UtilityReadings (one-to-many)

PaymentPlan
├── Lease
└── Payments (one-to-many)

RentWallet
├── User
├── Lease (optional)
└── Deposits/Withdrawals

Booking
├── Unit
├── Tenant (User)
└── Landlord (User)
```

## Indexes

All models have appropriate indexes for optimal query performance:

- **Single field indexes**: userId, status, createdAt, etc.
- **Compound indexes**: For common queries (userId + status, etc.)
- **Geospatial index**: Property.location.coordinates (2dsphere)
- **Text indexes**: (Can be added for search functionality)
- **TTL index**: Notification.expiresAt (auto-delete expired)

## Usage Examples

### Import Models
```javascript
// Import individual models
import { User, Property, Unit } from './models/index.js';

// Or import all
import models from './models/index.js';
const { User, Property } = models;
```

### Create a User
```javascript
const user = await User.create({
  email: 'tenant@example.com',
  password: 'SecurePassword123!',
  phone: '+254712345678',
  role: 'tenant',
  profile: {
    firstName: 'John',
    lastName: 'Doe'
  }
});
```

### Find Affordable Units
```javascript
const affordableUnits = await Unit.findAffordableUnits(150, {
  'location.address.city': 'Nairobi'
});
```

### Create Rent Wallet and Deposit
```javascript
const wallet = await RentWallet.create({
  userId: user._id,
  targetAmount: 5000,
  walletType: 'rent_savings'
});

await wallet.deposit(100, 'mpesa', paymentId);
```

## Best Practices

1. **Always use transactions** for operations that modify multiple documents
2. **Populate sparingly** - Only populate fields you need
3. **Use lean()** for read-only queries to improve performance
4. **Index your queries** - Check slow query logs regularly
5. **Validate input** before saving to database
6. **Use methods and statics** for reusable logic
7. **Handle errors** appropriately with try-catch
8. **Log important operations** for debugging

## Performance Considerations

- Use `.lean()` for read-only queries (faster)
- Avoid deep population (limit to 2-3 levels)
- Use projection to limit returned fields
- Implement pagination for large result sets
- Use aggregation pipeline for complex queries
- Cache frequently accessed data (Redis)

## Security Notes

- Passwords are automatically hashed before saving
- Sensitive fields (password) are excluded by default
- Input validation using Mongoose validators
- Sanitize user input to prevent NoSQL injection
- Use HTTPS for all API communications
- Implement rate limiting on sensitive endpoints

---

**Last Updated**: October 2025
**Version**: 1.0.0
