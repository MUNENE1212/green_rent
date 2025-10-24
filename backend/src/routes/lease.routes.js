import express from 'express';
import {
  createLease,
  signLease,
  activateLease,
  terminateLease,
  renewLease,
  markDepositPaid,
  addMoveInInspection,
  addMoveOutInspection,
  getLeaseById,
  getAllLeases,
  getExpiringLeases,
  getOverdueLeases,
  getLeaseDocument
} from '../controllers/lease.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Landlord/Admin routes
router.get('/expiring', authorize('landlord', 'admin'), getExpiringLeases);
router.get('/overdue', authorize('landlord', 'admin'), getOverdueLeases);

// General routes
router.get('/', getAllLeases);
router.get('/:id', getLeaseById);
router.get('/:id/document', getLeaseDocument);

// Landlord/Admin only
router.post('/', authorize('landlord', 'admin'), createLease);
router.put('/:id/activate', authorize('landlord', 'admin'), activateLease);
router.post('/:id/renew', authorize('landlord', 'admin'), renewLease);
router.put('/:id/deposit-paid', authorize('landlord', 'admin'), markDepositPaid);
router.put('/:id/move-in-inspection', authorize('landlord', 'admin'), addMoveInInspection);
router.put('/:id/move-out-inspection', authorize('landlord', 'admin'), addMoveOutInspection);

// Shared routes (tenant or landlord)
router.put('/:id/sign', signLease);
router.put('/:id/terminate', terminateLease);

export default router;
