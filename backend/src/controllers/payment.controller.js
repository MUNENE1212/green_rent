import Payment from '../models/Payment.model.js';
import PaymentPlan from '../models/PaymentPlan.model.js';
import Lease from '../models/Lease.model.js';
import RentWallet from '../models/RentWallet.model.js';
import User from '../models/User.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// IntaSend integration (placeholder - will need actual SDK)
// import IntaSend from 'intasend-node';
// const intasend = new IntaSend(process.env.INTASEND_PUBLISHABLE_KEY, process.env.INTASEND_SECRET_KEY);

/**
 * @desc    Initiate payment (create payment intent)
 * @route   POST /api/v1/payments/initiate
 * @access  Private (Tenant)
 */
export const initiatePayment = catchAsync(async (req, res, next) => {
  const {
    leaseId,
    amount,
    type,
    paymentMethod,
    useWallet,
    walletAmount,
    metadata
  } = req.body;

  // Validate lease and get details
  const lease = await Lease.findById(leaseId)
    .populate('tenantId', 'profile email phone')
    .populate('landlordId', 'profile email phone')
    .populate('unitId', 'unitNumber property pricing');

  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Verify tenant is the one making payment
  if (lease.tenantId._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Unauthorized to make payment for this lease', 403));
  }

  // Create payment record
  const payment = await Payment.create({
    leaseId,
    tenantId: lease.tenantId._id,
    landlordId: lease.landlordId._id,
    amount,
    type,
    paymentMethod,
    walletUsed: useWallet || false,
    walletAmount: walletAmount || 0,
    metadata: {
      ...metadata,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    },
    breakdown: {
      baseRent: type === 'rent' ? amount : 0,
      total: amount
    },
    status: 'pending',
    initiatedAt: Date.now()
  });

  // If using wallet, deduct from wallet
  if (useWallet && walletAmount > 0) {
    const wallet = await RentWallet.findOne({ userId: lease.tenantId._id, status: 'active' });

    if (!wallet) {
      return next(new AppError('Rent wallet not found', 404));
    }

    if (wallet.balance < walletAmount) {
      return next(new AppError('Insufficient wallet balance', 400));
    }

    // Deduct from wallet
    wallet.balance -= walletAmount;
    wallet.transactions.push({
      type: 'payment',
      amount: -walletAmount,
      description: `Payment for ${type}`,
      balanceAfter: wallet.balance,
      paymentId: payment._id
    });
    await wallet.save();
  }

  // Calculate remaining amount to be paid via payment method
  const remainingAmount = amount - (walletAmount || 0);

  // If fully paid by wallet
  if (remainingAmount <= 0) {
    await payment.markAsCompleted({ walletPayment: true });

    return res.status(201).json({
      success: true,
      message: 'Payment completed successfully using wallet',
      data: { payment }
    });
  }

  // Integrate with IntaSend for remaining amount
  // This is a placeholder - actual integration will depend on IntaSend SDK
  let paymentLink = null;
  let checkoutId = null;

  try {
    // Example IntaSend integration (pseudo-code)
    /*
    const checkout = await intasend.collection({
      amount: remainingAmount,
      currency: 'KES',
      email: lease.tenantId.email,
      phone_number: lease.tenantId.phone,
      api_ref: payment._id.toString(),
      redirect_url: `${process.env.CLIENT_URL}/payments/success`,
      callback_url: `${process.env.API_URL}/api/v1/payments/webhook`,
      method: paymentMethod === 'mpesa' ? 'M-PESA' : 'CARD'
    });

    paymentLink = checkout.url;
    checkoutId = checkout.id;
    */

    // For now, generate a mock payment link
    paymentLink = `https://sandbox.intasend.com/checkout/${payment._id}`;
    checkoutId = `CHK_${Date.now()}`;

    // Update payment with IntaSend details
    payment.intasend.checkoutId = checkoutId;
    payment.intasend.paymentLink = paymentLink;
    payment.status = 'processing';
    await payment.save();

  } catch (error) {
    return next(new AppError(`Payment gateway error: ${error.message}`, 500));
  }

  res.status(201).json({
    success: true,
    message: 'Payment initiated successfully',
    data: {
      payment,
      paymentLink,
      checkoutId,
      remainingAmount
    }
  });
});

/**
 * @desc    Handle IntaSend webhook
 * @route   POST /api/v1/payments/webhook
 * @access  Public (IntaSend callback)
 */
export const handleWebhook = catchAsync(async (req, res, next) => {
  // Verify webhook signature (IntaSend specific)
  // const signature = req.headers['x-intasend-signature'];
  // Implement signature verification

  const webhookData = req.body;

  // Find payment by IntaSend reference
  const payment = await Payment.findOne({
    $or: [
      { 'intasend.checkoutId': webhookData.checkout_id },
      { 'intasend.invoiceId': webhookData.invoice_id },
      { '_id': webhookData.api_ref }
    ]
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  // Update payment based on webhook status
  switch (webhookData.state) {
    case 'COMPLETE':
    case 'SUCCESS':
      await payment.markAsCompleted({
        intasend: {
          transactionId: webhookData.transaction_id,
          trackingId: webhookData.tracking_id,
          callbackData: webhookData
        },
        mpesa: webhookData.payment_method === 'M-PESA' ? {
          phoneNumber: webhookData.phone_number,
          mpesaReceiptNumber: webhookData.mpesa_reference,
          transactionDate: webhookData.created_at,
          accountReference: webhookData.account
        } : undefined
      });
      break;

    case 'FAILED':
      await payment.markAsFailed(
        webhookData.failed_code || 'PAYMENT_FAILED',
        webhookData.failed_reason || 'Payment failed'
      );
      break;

    case 'PENDING':
      payment.status = 'processing';
      await payment.save();
      break;

    default:
      break;
  }

  // Acknowledge webhook
  res.status(200).json({ received: true });
});

/**
 * @desc    Get payment by ID
 * @route   GET /api/v1/payments/:id
 * @access  Private
 */
export const getPaymentById = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('tenantId', 'profile email phone')
    .populate('landlordId', 'profile email phone')
    .populate('leaseId', 'leaseNumber unitId startDate endDate');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Check authorization
  const isAuthorized =
    payment.tenantId._id.toString() === req.user._id.toString() ||
    payment.landlordId._id.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to view this payment', 403));
  }

  res.status(200).json({
    success: true,
    data: { payment }
  });
});

/**
 * @desc    Get all payments (with filters)
 * @route   GET /api/v1/payments
 * @access  Private
 */
export const getAllPayments = catchAsync(async (req, res, next) => {
  const {
    status,
    type,
    paymentMethod,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page = 1,
    limit = 20,
    sortBy = '-createdAt'
  } = req.query;

  // Build filter
  const filter = {};

  // Role-based filtering
  if (req.user.role === 'tenant') {
    filter.tenantId = req.user._id;
  } else if (req.user.role === 'landlord') {
    filter.landlordId = req.user._id;
  }
  // Admin can see all

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  // Execute query
  const payments = await Payment.find(filter)
    .populate('tenantId', 'profile email phone')
    .populate('landlordId', 'profile email phone')
    .populate('leaseId', 'leaseNumber unitId')
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Payment.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get payment statistics
 * @route   GET /api/v1/payments/statistics
 * @access  Private
 */
export const getPaymentStatistics = catchAsync(async (req, res, next) => {
  const { period = 'month' } = req.query;

  const userId = req.user._id;
  const role = req.user.role;

  const stats = await Payment.getStatistics(userId, role, period);

  // Additional aggregations
  const matchField = role === 'tenant' ? 'tenantId' : 'landlordId';

  const typeBreakdown = await Payment.aggregate([
    { $match: { [matchField]: userId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const methodBreakdown = await Payment.aggregate([
    { $match: { [matchField]: userId, status: 'completed' } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      statistics: {
        byStatus: stats,
        byType: typeBreakdown,
        byMethod: methodBreakdown
      }
    }
  });
});

/**
 * @desc    Retry failed payment
 * @route   POST /api/v1/payments/:id/retry
 * @access  Private (Tenant)
 */
export const retryPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Verify tenant ownership
  if (payment.tenantId.toString() !== req.user._id.toString()) {
    return next(new AppError('Unauthorized to retry this payment', 403));
  }

  await payment.retry();

  // Re-initiate payment with IntaSend
  // Similar to initiatePayment logic

  res.status(200).json({
    success: true,
    message: 'Payment retry initiated',
    data: { payment }
  });
});

/**
 * @desc    Refund payment
 * @route   POST /api/v1/payments/:id/refund
 * @access  Private (Admin/Landlord)
 */
export const refundPayment = catchAsync(async (req, res, next) => {
  const { refundAmount, reason } = req.body;

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Verify authorization (landlord or admin)
  const isAuthorized =
    payment.landlordId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to refund this payment', 403));
  }

  await payment.processRefund(refundAmount, reason, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Payment refunded successfully',
    data: { payment }
  });
});

/**
 * @desc    Get overdue payments
 * @route   GET /api/v1/payments/overdue
 * @access  Private (Landlord/Admin)
 */
export const getOverduePayments = catchAsync(async (req, res, next) => {
  let overduePayments = await Payment.findOverduePayments();

  // Filter by landlord if not admin
  if (req.user.role === 'landlord') {
    overduePayments = overduePayments.filter(
      p => p.landlordId._id.toString() === req.user._id.toString()
    );
  }

  res.status(200).json({
    success: true,
    data: {
      payments: overduePayments,
      count: overduePayments.length
    }
  });
});

/**
 * @desc    Record manual payment (cash/bank transfer)
 * @route   POST /api/v1/payments/manual
 * @access  Private (Landlord/Admin)
 */
export const recordManualPayment = catchAsync(async (req, res, next) => {
  const {
    leaseId,
    amount,
    type,
    paymentMethod,
    description,
    receiptUrl,
    paymentDate
  } = req.body;

  // Verify lease exists
  const lease = await Lease.findById(leaseId);
  if (!lease) {
    return next(new AppError('Lease not found', 404));
  }

  // Verify landlord ownership or admin
  const isAuthorized =
    lease.landlordId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to record payment for this lease', 403));
  }

  // Create payment record
  const payment = await Payment.create({
    leaseId,
    tenantId: lease.tenantId,
    landlordId: lease.landlordId,
    amount,
    type,
    paymentMethod,
    description,
    receiptUrl,
    status: 'completed',
    initiatedAt: paymentDate || Date.now(),
    completedAt: paymentDate || Date.now(),
    breakdown: {
      baseRent: type === 'rent' ? amount : 0,
      total: amount
    }
  });

  // Update lease payment summary
  await lease.updatePaymentSummary();

  res.status(201).json({
    success: true,
    message: 'Manual payment recorded successfully',
    data: { payment }
  });
});

/**
 * @desc    Generate payment receipt
 * @route   GET /api/v1/payments/:id/receipt
 * @access  Private
 */
export const generateReceipt = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('tenantId', 'profile email phone')
    .populate('landlordId', 'profile email phone')
    .populate('leaseId', 'leaseNumber unitId property');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Check authorization
  const isAuthorized =
    payment.tenantId._id.toString() === req.user._id.toString() ||
    payment.landlordId._id.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('Unauthorized to view this receipt', 403));
  }

  // Generate receipt (this would typically use a PDF generation library)
  const receipt = {
    receiptNumber: `RCP-${payment._id.toString().substring(0, 8).toUpperCase()}`,
    date: payment.completedAt || payment.createdAt,
    tenant: {
      name: `${payment.tenantId.profile.firstName} ${payment.tenantId.profile.lastName}`,
      email: payment.tenantId.email,
      phone: payment.tenantId.phone
    },
    landlord: {
      name: `${payment.landlordId.profile.firstName} ${payment.landlordId.profile.lastName}`,
      email: payment.landlordId.email
    },
    payment: {
      amount: payment.amount,
      type: payment.type,
      method: payment.paymentMethod,
      status: payment.status,
      transactionId: payment.intasend?.transactionId || payment.mpesaDetails?.mpesaReceiptNumber
    },
    breakdown: payment.breakdown
  };

  res.status(200).json({
    success: true,
    data: { receipt }
  });
});
