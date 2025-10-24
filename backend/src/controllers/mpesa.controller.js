/**
 * M-Pesa Controller
 * Handles M-Pesa payment callbacks and status queries
 */

import { Payment, RentWallet } from '../models/index.js';
import ApiResponse from '../utils/apiResponse.js';
import catchAsync from '../utils/catchAsync.js';
import mpesaService from '../services/mpesa.service.js';

/**
 * Handle M-Pesa STK Push callback
 * POST /api/v1/payments/mpesa/callback
 */
export const mpesaCallback = catchAsync(async (req, res) => {
  console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));

  try {
    // Process the callback data
    const callbackResult = mpesaService.processCallback(req.body);

    console.log('Processed Callback Result:', callbackResult);

    // Find the payment record using checkout request ID
    const payment = await Payment.findOne({
      mpesaCheckoutRequestId: callbackResult.checkoutRequestId
    });

    if (!payment) {
      console.error('Payment not found for checkout request:', callbackResult.checkoutRequestId);
      // Still return success to M-Pesa to avoid retries
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Callback received'
      });
    }

    if (callbackResult.success) {
      // Payment was successful
      payment.status = 'completed';
      payment.mpesaReceiptNumber = callbackResult.mpesaReceiptNumber;
      payment.transactionDate = new Date(callbackResult.transactionDate?.toString());
      payment.completedAt = new Date();
      await payment.save();

      // Update wallet balance
      const wallet = await RentWallet.findById(payment.walletId);
      if (wallet) {
        await wallet.deposit(
          callbackResult.amount,
          'mpesa',
          callbackResult.mpesaReceiptNumber,
          `M-Pesa deposit - ${callbackResult.mpesaReceiptNumber}`
        );
        console.log(`Wallet ${wallet._id} updated with KES ${callbackResult.amount}`);
      }

      console.log(`Payment ${payment._id} marked as completed`);
    } else {
      // Payment failed or was cancelled
      payment.status = 'failed';
      payment.errorMessage = callbackResult.resultDesc;
      await payment.save();

      console.log(`Payment ${payment._id} marked as failed: ${callbackResult.resultDesc}`);
    }

    // Respond to M-Pesa
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Callback processed successfully'
    });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);

    // Still return success to M-Pesa to avoid retries
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Callback received'
    });
  }
});

/**
 * Query M-Pesa payment status
 * GET /api/v1/payments/mpesa/:paymentId/status
 */
export const queryPaymentStatus = catchAsync(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    return ApiResponse.notFound(res, 'Payment not found');
  }

  // Check if user owns this payment
  if (payment.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only check your own payments');
  }

  // If payment is already completed or failed, return current status
  if (payment.status === 'completed' || payment.status === 'failed') {
    return ApiResponse.success(res, 200, 'Payment status retrieved', {
      status: payment.status,
      amount: payment.amount,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
      completedAt: payment.completedAt
    });
  }

  // Query M-Pesa for current status
  try {
    const statusResult = await mpesaService.querySTKPushStatus(payment.mpesaCheckoutRequestId);

    // Update payment status based on result
    if (statusResult.resultCode === '0') {
      payment.status = 'completed';
      payment.completedAt = new Date();
    } else if (statusResult.resultCode === '1032') {
      payment.status = 'cancelled';
      payment.errorMessage = 'User cancelled the request';
    } else {
      payment.status = 'failed';
      payment.errorMessage = statusResult.resultDesc;
    }

    await payment.save();

    return ApiResponse.success(res, 200, 'Payment status updated', {
      status: payment.status,
      resultCode: statusResult.resultCode,
      resultDesc: statusResult.resultDesc
    });
  } catch (error) {
    console.error('Error querying M-Pesa status:', error);
    return ApiResponse.error(res, 500, 'Failed to query payment status');
  }
});

/**
 * Get payment details
 * GET /api/v1/payments/:id
 */
export const getPayment = catchAsync(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate('userId', 'profile.firstName profile.lastName email')
    .populate('walletId');

  if (!payment) {
    return ApiResponse.notFound(res, 'Payment not found');
  }

  // Check if user owns this payment
  if (payment.userId._id.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only view your own payments');
  }

  return ApiResponse.success(res, 200, 'Payment retrieved successfully', { payment });
});

/**
 * Get user's payment history
 * GET /api/v1/payments/my-payments
 */
export const getMyPayments = catchAsync(async (req, res) => {
  const { status, type, limit = 20, page = 1 } = req.query;

  const query = { userId: req.user._id };

  if (status) query.status = status;
  if (type) query.type = type;

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .populate('walletId', 'balance');

  const total = await Payment.countDocuments(query);

  return ApiResponse.success(res, 200, 'Payments retrieved successfully', {
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});
