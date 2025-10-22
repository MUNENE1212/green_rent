# 🏡 GreenRent - AI-Powered Flexible Rental Management Platform

## Overview
GreenRent is a comprehensive rental management platform designed to democratize housing access through AI-powered flexible payment plans, daily micro-savings (Rent Wallet), and virtual viewing technology.

### Core Features
- 💰 **Rent Wallet** - Save daily micro-amounts (as low as KES 10) towards rent
- 📅 **Flexible Payment Plans** - Daily, weekly, bi-weekly, or monthly payments
- 🎥 **Virtual Viewing** - 360° tours, video walkthroughs, comprehensive photo galleries
- 🤖 **AI-Powered Pricing** - Smart rent pricing and payment plan recommendations
- 📱 **Mobile-First PWA** - Accessible on any device
- 🔐 **Secure Payments** - IntaSend integration (M-Pesa, Cards, Bank transfers)

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Payment Gateway**: IntaSend (M-Pesa, Cards)
- **File Storage**: AWS S3 / Cloudinary
- **Caching**: Redis

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Maps**: Leaflet
- **Charts**: Recharts

### AI/ML Service (Planned - Phase 2)
- **Language**: Python 3.11+
- **Framework**: FastAPI
- **ML Libraries**: TensorFlow, Scikit-learn, XGBoost

## Project Structure
```
green_rent/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── models/         # Mongoose models
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── .env               # Environment variables
│   ├── .env.example       # Environment template
│   ├── package.json
│   └── server.js          # Entry point
│
├── frontend/               # Next.js application
│   ├── app/               # Next.js 14 app directory
│   ├── components/        # React components
│   ├── lib/               # Utilities and helpers
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript types
│   ├── public/            # Static assets
│   └── package.json
│
├── docs/                   # Documentation
│   ├── masterplan.md      # Project master plan
│   ├── technical specs.md # Technical specifications
│   ├── medels&routes.md   # API documentation
│   └── features1.md       # Feature details
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- MongoDB (local or Atlas)
- Redis (optional for caching)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd green_rent
```

2. **Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if running locally)
mongod

# Run development server
npm run dev
```

Backend will run on `http://localhost:5000`

3. **Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### Quick Test
- Backend health check: http://localhost:5000/health
- Backend API: http://localhost:5000/api/v1
- Frontend: http://localhost:3000

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/greenrent
JWT_SECRET=your_jwt_secret
INTASEND_API_KEY=your_intasend_key
# See .env.example for complete list
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_INTASEND_PUBLISHABLE_KEY=your_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
```

## Development Workflow

### Running Both Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Database Setup
```bash
# Make sure MongoDB is running
mongod

# The application will create collections automatically
```

## API Documentation

Base URL: `http://localhost:5000/api/v1`

### Main Endpoints (Planned)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/properties` - List properties
- `GET /api/v1/units/:id` - Get unit details
- `POST /api/v1/wallet/deposit` - Deposit to rent wallet
- `POST /api/v1/payments/initiate` - Initiate payment

See `docs/medels&routes.md` for complete API documentation.

## Development Phases

### Phase 1: MVP (Current - Months 1-3)
- [x] Project initialization
- [x] Backend structure setup
- [x] Frontend structure setup
- [ ] User authentication system
- [ ] Property & unit management
- [ ] Rent wallet system
- [ ] Basic payment integration (M-Pesa)
- [ ] Booking/viewing system

### Phase 2: AI Integration (Months 4-5)
- [ ] AI pricing engine
- [ ] Payment plan optimizer
- [ ] Enhanced virtual viewing

### Phase 3: Advanced Features (Months 6-8)
- [ ] Utility management
- [ ] Maintenance system
- [ ] Advanced analytics

## Contributing
This is a private project currently in development. Contribution guidelines will be added later.

## Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Deployment
Deployment instructions will be added once the MVP is complete.

## Social Impact
GreenRent aims to enable 10,000+ low-income earners to access decent housing in Year 1 through:
- Micro-savings capabilities (save as low as KES 10)
- Daily payment options
- Financial inclusion for the unbanked
- Credit history building

## License
Proprietary - All rights reserved

## Contact
For questions or support, contact the GreenRent team.

---

**Built with ❤️ to democratize housing access in Kenya and East Africa**
