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

// Import routes (will be added later)
// import authRoutes from './src/routes/auth.routes.js';
// import userRoutes from './src/routes/user.routes.js';
// import propertyRoutes from './src/routes/property.routes.js';

// Use routes (will be uncommented as we create them)
// app.use(`/api/${API_VERSION}/auth`, authRoutes);
// app.use(`/api/${API_VERSION}/users`, userRoutes);
// app.use(`/api/${API_VERSION}/properties`, propertyRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
});

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
