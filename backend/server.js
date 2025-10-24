import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import connectDB from './src/config/database.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GreenRent API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Welcome route
app.get(`/api/${API_VERSION}`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to GreenRent API',
    version: API_VERSION,
    documentation: '/api/v1/docs'
  });
});

// Import middleware
import errorHandler from './src/middleware/errorHandler.js';

// Import routes
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import propertyRoutes from './src/routes/property.routes.js';
import unitRoutes from './src/routes/unit.routes.js';
import rentWalletRoutes from './src/routes/rentWallet.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';
import bookingRoutes from './src/routes/booking.routes.js';
import leaseRoutes from './src/routes/lease.routes.js';

// Use routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/properties`, propertyRoutes);
app.use(`/api/${API_VERSION}/units`, unitRoutes);
app.use(`/api/${API_VERSION}/rent-wallets`, rentWalletRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/bookings`, bookingRoutes);
app.use(`/api/${API_VERSION}/leases`, leaseRoutes);

// 404 handler - Must be after all routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl
  });
});

// Global error handler - Must be last
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║                                            ║
  ║        🏡 GreenRent API Server 🏡         ║
  ║                                            ║
  ║  Environment: ${process.env.NODE_ENV?.toUpperCase().padEnd(28)} ║
  ║  Port: ${PORT.toString().padEnd(35)} ║
  ║  API Version: ${API_VERSION.padEnd(28)} ║
  ║                                            ║
  ║  Health: http://localhost:${PORT}/health${' '.repeat(10)}║
  ║  API: http://localhost:${PORT}/api/${API_VERSION}${' '.repeat(12)}║
  ║                                            ║
  ╚════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

export default app;
