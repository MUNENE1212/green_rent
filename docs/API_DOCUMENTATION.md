# GreenRent API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
Most endpoints require JWT authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account (tenant or landlord).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
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
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresIn": "1h"
    }
  }
}
```

---

### Login
**POST** `/auth/login`

Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresIn": "1h"
    }
  }
}
```

---

### Refresh Token
**POST** `/auth/refresh`

Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "..."
}
```

---

### Logout
**POST** `/auth/logout` 🔒

Invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "..."
}
```

---

### Get Current User
**GET** `/auth/me` 🔒

Get authenticated user's profile.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "email": "user@example.com",
      "role": "tenant",
      "profile": { ... }
    }
  }
}
```

---

### Verify Email
**GET** `/auth/verify-email/:token`

Verify user's email address.

---

### Forgot Password
**POST** `/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

### Reset Password
**POST** `/auth/reset-password/:token`

Reset password with token.

**Request Body:**
```json
{
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

---

### Change Password
**POST** `/auth/change-password` 🔒

Change password for authenticated user.

**Request Body:**
```json
{
  "currentPassword": "OldPassword",
  "newPassword": "NewPassword123",
  "confirmNewPassword": "NewPassword123"
}
```

---

## 2. User Management Endpoints

### Get All Users
**GET** `/users` 🔒 👑

Get all users with filtering (Admin only).

**Query Parameters:**
- `role` - Filter by role (tenant, landlord, admin)
- `status` - Filter by status (active, suspended, banned)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: createdAt)
- `order` - Sort order (asc/desc)

---

### Get User by ID
**GET** `/users/:id` 🔒

Get user profile by ID (own profile or admin).

---

### Update User
**PUT** `/users/:id` 🔒

Update user profile (own profile or admin).

**Request Body:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "occupation": "Software Engineer"
  },
  "financialProfile": {
    "monthlyIncome": 50000,
    "incomeFrequency": "monthly"
  }
}
```

---

### Delete User
**DELETE** `/users/:id` 🔒

Soft delete user account.

---

### Upload Document
**POST** `/users/:id/documents` 🔒

Upload user document (ID, payslip, etc.).

**Request Body:**
```json
{
  "type": "id",
  "name": "National ID",
  "url": "https://...",
  "expiryDate": "2030-12-31"
}
```

---

### Verify Document
**PUT** `/users/:id/documents/:documentId/verify` 🔒 👑

Verify user document (Admin only).

---

### Search Users
**GET** `/users/search` 🔒 👑

Search users by name, email, or phone (Admin only).

**Query Parameters:**
- `q` - Search query (required)
- `role` - Filter by role
- `status` - Filter by status
- `page`, `limit` - Pagination

---

### Get User Statistics
**GET** `/users/statistics` 🔒 👑

Get user analytics (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalByRole": [ ... ],
      "totalByStatus": [ ... ],
      "verificationStats": { ... },
      "averageCreditScore": 650
    }
  }
}
```

---

## 3. Property Endpoints

### Get All Properties
**GET** `/properties`

Get all active properties with filtering.

**Query Parameters:**
- `propertyType` - apartment, standalone, gated_community, etc.
- `city` - Filter by city
- `county` - Filter by county
- `minPrice`, `maxPrice` - Price range
- `amenities` - Comma-separated list
- `featured` - true/false
- `verified` - true/false
- `lat`, `lng`, `radius` - Geospatial search (radius in km)
- `page`, `limit` - Pagination

---

### Get Property by ID
**GET** `/properties/:id`

Get property details with units.

**Response:**
```json
{
  "success": true,
  "data": {
    "property": {
      "name": "Green Valley Apartments",
      "location": { ... },
      "amenities": { ... }
    },
    "units": [ ... ]
  }
}
```

---

### Create Property
**POST** `/properties` 🔒 🏠

Create new property (Landlord only).

**Request Body:**
```json
{
  "name": "Green Valley Apartments",
  "propertyType": "apartment",
  "location": {
    "address": {
      "street": "Ngong Road",
      "city": "Nairobi",
      "county": "Nairobi"
    },
    "coordinates": {
      "type": "Point",
      "coordinates": [36.8219, -1.2921]
    }
  },
  "amenities": {
    "security": ["cctv", "guard"],
    "utilities": ["water", "electricity"],
    "facilities": ["parking", "gym"]
  }
}
```

---

### Update Property
**PUT** `/properties/:id` 🔒

Update property (own property or admin).

---

### Delete Property
**DELETE** `/properties/:id` 🔒

Delete property (soft delete, no occupied units).

---

### Upload Property Media
**POST** `/properties/:id/media` 🔒

Upload photos, videos, 360 tours, or floor plans.

**Request Body:**
```json
{
  "type": "photo",
  "url": "https://...",
  "caption": "Living room view",
  "isPrimary": true
}
```

---

### Set Primary Image
**PUT** `/properties/:id/media/primary` 🔒

Set property's primary image.

**Request Body:**
```json
{
  "imageId": "..."
}
```

---

### Search Properties
**GET** `/properties/search`

Search properties by name or location.

**Query Parameters:**
- `q` - Search query (required)
- `page`, `limit` - Pagination

---

### Get Landlord Properties
**GET** `/properties/landlord/:landlordId` 🔒

Get all properties by landlord.

---

### Toggle Featured
**PUT** `/properties/:id/featured` 🔒

Toggle property featured status.

---

### Verify Property
**PUT** `/properties/:id/verify` 🔒 👑

Verify property (Admin only).

---

## 4. Unit Endpoints

### Get All Units
**GET** `/units`

Get all units with filtering.

**Query Parameters:**
- `propertyId` - Filter by property
- `unitType` - single_room, bedsitter, studio, 1-4 bedrooms, DSQ
- `availabilityStatus` - available, occupied, reserved, maintenance
- `minPrice`, `maxPrice` - Price range
- `bedrooms`, `bathrooms` - Number of rooms
- `furnished` - true/false
- `page`, `limit` - Pagination

---

### Get Unit by ID
**GET** `/units/:id`

Get unit details with affordability breakdown.

**Response:**
```json
{
  "success": true,
  "data": {
    "unit": { ... },
    "affordability": {
      "monthly": 5000,
      "daily": 167,
      "weekly": 1250,
      "microSavings": {
        "daily": 167,
        "recommendedDailyTarget": 150
      }
    }
  }
}
```

---

### Get Affordable Units
**GET** `/units/affordable`

Find units within daily budget.

**Query Parameters:**
- `maxDailyBudget` - Maximum daily budget (required)
- `city`, `county` - Location filters
- `unitType` - Unit type filter
- `page`, `limit` - Pagination

**Example:**
```
GET /units/affordable?maxDailyBudget=150&city=Nairobi
```

---

### Get Units with Virtual Tours
**GET** `/units/virtual-tours`

Get units with 80%+ media completeness.

---

### Create Unit
**POST** `/units` 🔒 🏠

Create new unit (Landlord only).

**Request Body:**
```json
{
  "propertyId": "...",
  "unitNumber": "A101",
  "unitType": "1_bedroom",
  "bedrooms": 1,
  "bathrooms": 1,
  "pricing": {
    "baseRent": 5000,
    "deposit": 5000
  }
}
```

---

### Update Unit
**PUT** `/units/:id` 🔒

Update unit (landlord of property or admin).

---

### Delete Unit
**DELETE** `/units/:id` 🔒

Delete unit (cannot delete occupied).

---

### Reserve Unit
**POST** `/units/:id/reserve` 🔒 🏘️

Reserve unit for tenant.

---

### Occupy Unit
**POST** `/units/:id/occupy` 🔒 🏠

Mark unit as occupied.

**Request Body:**
```json
{
  "tenantId": "...",
  "leaseId": "..."
}
```

---

### Vacate Unit
**POST** `/units/:id/vacate` 🔒 🏠

Mark unit as vacated.

---

### Upload Unit Media
**POST** `/units/:id/media` 🔒

Upload unit photos, videos, or 360 tours.

**Request Body:**
```json
{
  "type": "photo",
  "url": "https://...",
  "caption": "Bedroom view"
}
```

---

## 5. Rent Wallet Endpoints ⭐

### Create Rent Wallet
**POST** `/rent-wallets` 🔒 🏘️

Create new rent wallet (Tenant only).

**Request Body:**
```json
{
  "targetAmount": 5000,
  "walletType": "rent_savings",
  "autoSaveRules": {
    "enabled": true,
    "frequency": "daily",
    "amount": 100
  }
}
```

---

### Get My Wallet
**GET** `/rent-wallets/me` 🔒 🏘️

Get current tenant's wallet.

---

### Get Wallet by ID
**GET** `/rent-wallets/:id` 🔒

Get wallet details (own wallet or admin).

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "balance": 2500,
      "targetAmount": 5000,
      "gamification": {
        "currentStreak": 15,
        "longestStreak": 30,
        "achievements": ["First Deposit", "Week Streak"]
      }
    }
  }
}
```

---

### Deposit to Wallet
**POST** `/rent-wallets/:id/deposit` 🔒

Deposit money (minimum KES 10).

**Request Body:**
```json
{
  "amount": 100,
  "source": "mpesa",
  "transactionId": "ABC123",
  "note": "Daily savings"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deposit successful",
  "data": {
    "wallet": { ... },
    "deposit": { ... },
    "achievements": ["Day 15 Streak Bonus"]
  }
}
```

---

### Request Withdrawal
**POST** `/rent-wallets/:id/withdraw` 🔒

Request withdrawal (24-hour processing).

**Request Body:**
```json
{
  "amount": 500,
  "reason": "Emergency expense",
  "withdrawalMethod": "mpesa"
}
```

---

### Complete Withdrawal
**PUT** `/rent-wallets/:id/withdrawals/:withdrawalId/complete` 🔒 👑

Complete pending withdrawal (Admin only).

---

### Setup Auto-Save
**PUT** `/rent-wallets/:id/auto-save` 🔒

Configure auto-save rules.

**Request Body:**
```json
{
  "frequency": "daily",
  "amount": 100,
  "time": "09:00"
}
```

---

### Disable Auto-Save
**DELETE** `/rent-wallets/:id/auto-save` 🔒

Disable auto-save.

---

### Pay Rent from Wallet
**POST** `/rent-wallets/:id/pay-rent` 🔒

Pay rent using wallet balance.

**Request Body:**
```json
{
  "amount": 5000,
  "leaseId": "..."
}
```

---

### Get Wallet Statistics
**GET** `/rent-wallets/:id/statistics` 🔒

Get wallet analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "balance": 2500,
      "totalDeposits": 3000,
      "depositCount": 30,
      "averageDepositAmount": 100,
      "progress": {
        "percentage": 50,
        "remaining": 2500
      },
      "gamification": {
        "currentStreak": 15,
        "totalBonusesEarned": 150
      }
    }
  }
}
```

---

### Get Leaderboard
**GET** `/rent-wallets/leaderboard`

Get top savers for gamification.

**Query Parameters:**
- `period` - week, month, all (default: month)
- `limit` - Number of top savers (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "topSavers": [
      {
        "userId": "...",
        "profile": { "firstName": "John" },
        "totalSaved": 15000,
        "streak": 30
      }
    ]
  }
}
```

---

### Calculate Interest
**POST** `/rent-wallets/calculate-interest` 🔒 👑

Calculate interest for all wallets (Admin cron job).

---

### Close Wallet
**DELETE** `/rent-wallets/:id` 🔒

Close wallet (must have zero balance).

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-10-22T21:53:47.394Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": 400
  },
  "timestamp": "2025-10-22T21:53:47.394Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `423 Locked` - Account locked
- `500 Internal Server Error` - Server error

---

## Legend

- 🔒 - Requires authentication
- 👑 - Admin only
- 🏠 - Landlord only
- 🏘️ - Tenant only

---

## Key Features

### 1. Micro-Savings Wallet
- Minimum deposit: KES 10
- Multiple deposits per day
- Auto-save rules (daily, weekly, monthly)
- Gamification with streaks and bonuses
- Interest calculation (0.5% - 1% monthly)

### 2. Affordability Search
- Search units by daily budget
- Calculate daily, weekly, monthly breakdown
- Targeted recommendations

### 3. Virtual Viewing
- 360° tours
- Comprehensive media (photos, videos)
- Media completeness tracking
- Express move-in option

### 4. Geospatial Search
- Find properties near location
- Radius-based search (kilometers)
- Coordinates: [longitude, latitude]

### 5. Flexible Payment Plans
- Daily, weekly, bi-weekly, monthly
- Auto-generated schedules
- Grace periods and late fees

---

## Next Steps (To Be Implemented)

1. Payment endpoints (IntaSend integration)
2. Booking endpoints (viewing appointments, reservations)
3. Lease endpoints (create, sign, activate)
4. Maintenance request endpoints
5. Notification endpoints
6. File upload integration (AWS S3/Cloudinary)
7. Email/SMS services
8. Webhook handlers

---

**Last Updated:** October 2025
**API Version:** v1
