import express from 'express';
import {
  initiatePayment,
  handleWebhook,
  getPaymentById,
  getAllPayments,
  getPaymentStatistics,
  retryPayment,
  refundPayment,
  getOverduePayments,
  recordManualPayment,
  generateReceipt
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/webhook', handleWebhook);

// Protected routes - All authenticated users
router.use(protect);

router.get('/', getAllPayments);
router.get('/statistics', getPaymentStatistics);
router.get('/:id', getPaymentById);
router.get('/:id/receipt', generateReceipt);

// Tenant routes
router.post('/initiate', authorize('tenant'), initiatePayment);
router.post('/:id/retry', authorize('tenant'), retryPayment);

// Landlord/Admin routes
router.get('/overdue', authorize('landlord', 'admin'), getOverduePayments);
router.post('/manual', authorize('landlord', 'admin'), recordManualPayment);
router.post('/:id/refund', authorize('landlord', 'admin'), refundPayment);

export default router;
