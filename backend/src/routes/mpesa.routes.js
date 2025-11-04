/**
 * M-Pesa Payment Routes
 * Handles M-Pesa STK Push callbacks and payment queries
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  mpesaCallback,
  queryPaymentStatus,
  getPayment,
  getMyPayments
} from '../controllers/mpesa.controller.js';
import { initiateMpesaDeposit } from '../controllers/rentWallet.controller.js';
import mpesaService from '../services/mpesa.service.js';
import ApiResponse from '../utils/apiResponse.js';

const router = express.Router();

// Get all pending payments for debugging
router.get('/pending-payments', async (req, res) => {
  try {
    const { Payment } = await import('../models/index.js');
    const payments = await Payment.find({ status: 'pending' }).limit(10).sort({ createdAt: -1 });
    return ApiResponse.success(res, 200, 'Pending payments retrieved', { payments });
  } catch (error) {
    return ApiResponse.error(res, 500, error.message);
  }
});

// Manual callback simulator for testing (remove in production)
router.post('/simulate-callback', async (req, res) => {
  try {
    const { checkoutRequestId, paymentId } = req.body;

    if (!checkoutRequestId && !paymentId) {
      return ApiResponse.error(res, 400, 'checkoutRequestId or paymentId is required');
    }

    // Find the payment
    const { Payment, RentWallet } = await import('../models/index.js');
    let payment;

    if (paymentId) {
      payment = await Payment.findById(paymentId);
    } else {
      payment = await Payment.findOne({ mpesaCheckoutRequestId: checkoutRequestId });
    }

    if (!payment) {
      return ApiResponse.error(res, 404, 'Payment not found');
    }

    // Mark as completed
    payment.status = 'completed';
    payment.mpesaReceiptNumber = 'TEST' + Date.now();
    payment.completedAt = new Date();
    await payment.save();

    // Update wallet
    const wallet = await RentWallet.findById(payment.walletId);
    if (wallet) {
      await wallet.deposit(
        payment.amount,
        'mpesa',
        payment._id, // Pass Payment ObjectId, not receipt number
        `M-Pesa deposit - ${payment.mpesaReceiptNumber}`
      );
    }

    return ApiResponse.success(res, 200, 'Payment processed successfully', {
      payment,
      wallet
    });
  } catch (error) {
    return ApiResponse.error(res, 500, error.message);
  }
});

// Test endpoint to verify M-Pesa credentials
router.get('/test-credentials', async (req, res) => {
  try {
    // Check environment variables
    const envCheck = {
      MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY ? 'SET' : 'NOT SET',
      MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET ? 'SET' : 'NOT SET',
      MPESA_SHORTCODE: process.env.MPESA_SHORTCODE || 'NOT SET',
      MPESA_PASSKEY: process.env.MPESA_PASSKEY ? 'SET' : 'NOT SET',
      MPESA_ENVIRONMENT: process.env.MPESA_ENVIRONMENT || 'NOT SET',
    };

    console.log('Environment variables check:', envCheck);

    const token = await mpesaService.getAccessToken();
    return ApiResponse.success(res, 200, 'M-Pesa credentials are valid', {
      tokenReceived: !!token,
      environment: mpesaService.environment,
      envCheck
    });
  } catch (error) {
    return ApiResponse.error(res, 500, error.message, {
      envCheck: {
        MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY ? 'SET' : 'NOT SET',
        MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET ? 'SET' : 'NOT SET',
        MPESA_SHORTCODE: process.env.MPESA_SHORTCODE || 'NOT SET',
        MPESA_PASSKEY: process.env.MPESA_PASSKEY ? 'SET' : 'NOT SET',
        MPESA_ENVIRONMENT: process.env.MPESA_ENVIRONMENT || 'NOT SET',
      }
    });
  }
});

// Public routes (M-Pesa callbacks don't include auth)
router.post('/callback', mpesaCallback);

// Protected routes
router.post('/deposit', protect, initiateMpesaDeposit);
router.get('/payments/:paymentId/status', protect, queryPaymentStatus);
router.get('/payments/:id', protect, getPayment);
router.get('/payments/my-payments', protect, getMyPayments);

export default router;
