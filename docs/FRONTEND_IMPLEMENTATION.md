# GreenRent Frontend Implementation

## Overview
This document outlines the frontend implementation for GreenRent with a deep green theme, modern UI/UX, and full integration with the backend API.

## Theme Configuration

### Deep Green Color Palette
The application uses a professional deep green theme that conveys trust, growth, and sustainability:

- **Primary Colors**: Deep emerald greens (#047857 to #012418)
- **Accent Colors**: Warm gold/amber tones for CTAs
- **Secondary**: Professional grays for text and backgrounds

## Project Structure

```
frontend/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── register/
│   │       └── page.tsx          # Registration page
│   ├── layout.tsx                # Root layout with Navbar & Footer
│   ├── page.tsx                  # Home page with hero & features
│   └── globals.css               # Global styles
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            # Navigation with auth state
│   │   └── Footer.tsx            # Site footer
│   ├── property/                 # (To be implemented)
│   ├── wallet/                   # (To be implemented)
│   └── ui/                       # (To be implemented)
├── lib/
│   ├── api/
│   │   ├── client.ts             # Base API client
│   │   ├── auth.ts               # Authentication API
│   │   ├── properties.ts         # Properties & units API
│   │   ├── wallet.ts             # Rent wallet API
│   │   └── bookings.ts           # Bookings API
│   └── store/
│       └── authStore.ts          # Zustand auth state management
├── types/
│   └── index.ts                  # TypeScript interfaces
├── tailwind.config.js            # Tailwind with deep green theme
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

## Implemented Features

### 1. Theme & Styling
- ✅ Deep green color palette throughout
- ✅ Responsive design for mobile, tablet, and desktop
- ✅ Smooth animations and transitions
- ✅ Card shadows and hover effects
- ✅ Professional typography with Inter font

### 2. Layout Components
- ✅ **Navbar**: Responsive navigation with auth state
  - Logo and branding
  - Desktop and mobile menus
  - User dropdown with profile options
  - Conditional rendering based on auth status

- ✅ **Footer**: Comprehensive site footer
  - Quick links navigation
  - For Tenants and Landlords sections
  - Social links placeholder
  - Copyright and legal links

### 3. Home Page
- ✅ **Hero Section**: Eye-catching gradient background
  - Clear value proposition
  - Dual CTAs (Browse Properties & Sign Up)

- ✅ **Features Section**: Three core features
  - Rent Wallet with micro-savings
  - Flexible payment plans
  - Virtual property viewing

- ✅ **How It Works**: 3-step process
  - Sign Up → Find & Book → Move In

- ✅ **CTA Section**: Conversion-focused call-to-action

- ✅ **Stats Section**: Social proof with key metrics

### 4. Authentication
- ✅ **Login Page**
  - Email and password fields
  - Remember me option
  - Forgot password link
  - Social login placeholders (Google, Facebook)
  - Redirect to dashboard on success

- ✅ **Registration Page**
  - Role selection (Tenant/Landlord)
  - Complete form with validation
  - Password confirmation
  - Terms acceptance
  - Redirect to dashboard on success

### 5. API Integration
- ✅ **API Client** (`lib/api/client.ts`)
  - Base request handler with error handling
  - Cookie-based authentication
  - RESTful methods (GET, POST, PUT, PATCH, DELETE)

- ✅ **Authentication API** (`lib/api/auth.ts`)
  - Login, Register, Logout
  - Get current user
  - Password reset (forgot/reset)

- ✅ **Properties API** (`lib/api/properties.ts`)
  - Get properties with filters
  - Get property details
  - Search properties
  - Get property units
  - Get available units

- ✅ **Wallet API** (`lib/api/wallet.ts`)
  - Get wallet balance
  - Deposit funds
  - Withdraw funds
  - Get transactions
  - Update auto-save settings

- ✅ **Bookings API** (`lib/api/bookings.ts`)
  - Create booking (physical/virtual)
  - Get user bookings
  - Get booking details
  - Cancel booking

### 6. State Management
- ✅ **Auth Store** (Zustand with persistence)
  - User state
  - Token management
  - Login/logout actions
  - Loading states
  - LocalStorage persistence

### 7. TypeScript Types
- ✅ Complete type definitions for:
  - User, Property, Unit
  - RentWallet, Payment, PaymentPlan
  - Booking, Lease
  - API responses (single & paginated)

## Pending Implementation

### High Priority
1. **Property Listing Page** (`/properties`)
   - Grid/list view of properties
   - Filters (location, price, bedrooms, etc.)
   - Search functionality
   - Pagination

2. **Property Detail Page** (`/properties/[id]`)
   - Image gallery
   - Property information
   - Available units
   - Virtual tour integration
   - Booking button

3. **Wallet Dashboard** (`/wallet`)
   - Balance display
   - Deposit interface
   - Transaction history
   - Auto-save configuration
   - Payment method management

4. **User Dashboard** (`/dashboard`)
   - Overview stats
   - Recent bookings
   - Payment history
   - Quick actions

### Medium Priority
5. **Booking Management** (`/bookings`)
   - List of bookings
   - Booking details
   - Cancellation flow

6. **Profile Page** (`/profile`)
   - User information
   - Edit profile
   - Change password
   - Notification preferences

7. **Protected Routes**
   - Middleware for auth checking
   - Redirect to login if not authenticated

### Low Priority
8. **Additional Pages**
   - How It Works
   - Payment Plans
   - FAQ
   - Contact
   - About

9. **Components Library**
   - Reusable UI components
   - Form inputs
   - Buttons
   - Modals
   - Loading states

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_INTASEND_PUBLISHABLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_APP_NAME=GreenRent
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Running the Frontend

```bash
cd frontend

# Install dependencies (already done)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The frontend will run on `http://localhost:3000`

## Integration with Backend

The frontend is configured to connect to the backend API at `http://localhost:5000/api/v1`

### API Endpoints Used
- POST `/auth/login` - User login
- POST `/auth/register` - User registration
- GET `/auth/me` - Get current user
- GET `/properties` - List properties
- GET `/properties/:id` - Get property details
- GET `/units/:id` - Get unit details
- GET `/rent-wallets/my-wallet` - Get user's wallet
- POST `/rent-wallets/deposit` - Deposit to wallet
- POST `/bookings` - Create booking

## Testing

To test the implemented features:

1. **Start both servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

2. **Test Authentication**:
   - Visit `http://localhost:3000`
   - Click "Sign Up" or "Get Started"
   - Fill registration form
   - Should create user and redirect to dashboard (pending)

3. **Test Navigation**:
   - Check responsive menu
   - Test all navigation links
   - Verify auth state changes

## Next Steps

1. Implement property listing and detail pages
2. Create wallet dashboard
3. Build booking flow
4. Add protected route middleware
5. Implement loading and error states
6. Add form validation with Zod
7. Create reusable UI component library
8. Add unit tests
9. Integrate payment gateway (IntaSend)
10. Add virtual tour functionality

## Notes

- The deep green theme is consistent throughout the app
- All components are responsive and mobile-friendly
- TypeScript is used for type safety
- Zustand provides lightweight state management
- API client handles auth cookies automatically
- Error handling is implemented in API client

## Design Decisions

1. **Deep Green Theme**: Chosen to represent growth, trust, and sustainability
2. **Zustand over Redux**: Lighter weight, easier to use, sufficient for our needs
3. **Server Components**: Using Next.js 14 app directory for better performance
4. **Tailwind CSS**: Utility-first CSS for rapid development
5. **TypeScript**: Type safety and better developer experience
