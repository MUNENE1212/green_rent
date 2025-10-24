import express from 'express';
import {
  createBooking,
  payBookingFee,
  confirmViewing,
  completeViewing,
  trackVirtualViewing,
  cancelBooking,
  convertToLease,
  getBookingById,
  getAllBookings,
  getExpiringReservations,
  submitFeedback
} from '../controllers/booking.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Landlord/Admin routes
router.get('/expiring', authorize('landlord', 'admin'), getExpiringReservations);

// General routes
router.get('/', getAllBookings);
router.get('/:id', getBookingById);

// Tenant routes
router.post('/', authorize('tenant'), createBooking);
router.post('/:id/pay-fee', authorize('tenant'), payBookingFee);
router.put('/:id/track-virtual-viewing', authorize('tenant'), trackVirtualViewing);
router.put('/:id/feedback', authorize('tenant'), submitFeedback);

// Landlord routes
router.put('/:id/confirm-viewing', authorize('landlord', 'admin'), confirmViewing);
router.post('/:id/convert-to-lease', authorize('landlord', 'admin'), convertToLease);

// Shared routes (tenant or landlord)
router.put('/:id/complete-viewing', completeViewing);
router.put('/:id/cancel', cancelBooking);

export default router;
