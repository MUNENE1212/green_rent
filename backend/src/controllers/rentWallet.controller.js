/**
 * Rent Wallet Controller
 * Handles micro-savings wallet operations, deposits, withdrawals, and gamification
 */

import { RentWallet, User, Lease, Payment } from '../models/index.js';
import ApiResponse from '../utils/apiResponse.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import mpesaService from '../services/mpesa.service.js';

/**
 * Create rent wallet
 * POST /api/v1/rent-wallets
 */
export const createRentWallet = catchAsync(async (req, res) => {
  const { targetAmount, walletType, linkedLeaseId, autoSaveRules } = req.body;

  // Check if user already has an active wallet
  const existingWallet = await RentWallet.findOne({
    userId: req.user._id,
    status: 'active'
  });

  if (existingWallet) {
    return ApiResponse.error(res, 400, 'You already have an active rent wallet');
  }

  // Validate target amount
  if (!targetAmount || targetAmount < 1000) {
    return ApiResponse.error(res, 400, 'Target amount must be at least KES 1,000');
  }

  // Create wallet
  const wallet = await RentWallet.create({
    userId: req.user._id,
    targetAmount,
    walletType: walletType || 'rent_savings',
    linkedLeaseId,
    autoSaveRules
  });

  return ApiResponse.success(res, 201, 'Rent wallet created successfully', { wallet });
});

/**
 * Get user's rent wallet
 * GET /api/v1/rent-wallets/me
 */
export const getMyWallet = catchAsync(async (req, res) => {
  const wallet = await RentWallet.findOne({
    userId: req.user._id,
    status: 'active'
  });

  if (!wallet) {
    return ApiResponse.notFound(res, 'Rent wallet not found');
  }

  // Debug logging
  console.log('=== GET MY WALLET DEBUG ===');
  console.log('User ID:', req.user._id);
  console.log('Wallet ID:', wallet._id);
  console.log('Wallet balance:', wallet.balance);
  console.log('Deposits count:', wallet.deposits?.length);
  console.log('Wallet JSON:', JSON.stringify(wallet.toJSON(), null, 2));

  return ApiResponse.success(res, 200, 'Wallet retrieved successfully', { wallet });
});

/**
 * Get wallet by ID
 * GET /api/v1/rent-wallets/:id
 */
export const getWalletById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const wallet = await RentWallet.findById(id)
    .populate('userId', 'profile.firstName profile.lastName email')
    .populate('linkedLeaseId', 'leaseNumber unitId monthlyRent');

  if (!wallet) {
    return ApiResponse.notFound(res, 'Wallet not found');
  }

  // Check access permissions
  if (req.user.role !== 'admin' && wallet.userId._id.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only access your own wallet');
  }

  return ApiResponse.success(res, 200, 'Wallet retrieved successfully', { wallet });
});

/**
 * Deposit money to wallet
 * POST /api/v1/rent-wallets/:id/deposit
 */
export const depositToWallet = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { amount, source, transactionId, note } = req.body;

  // Validate amount
  if (!amount || amount < 10) {
    return ApiResponse.error(res, 400, 'Minimum deposit amount is KES 10');
  }

  const wallet = await RentWallet.findById(id);

  if (!wallet) {
    return ApiResponse.notFound(res, 'Wallet not found');
  }

  // Check ownership
  if (wallet.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only deposit to your own wallet');
  }

  if (wallet.status !== 'active') {
    return ApiResponse.error(res, 400, 'Wallet is not active');
  }

  // Validate source
  const validSources = ['mpesa', 'card', 'bank_transfer', 'wallet'];
  if (!source || !validSources.includes(source)) {
    return ApiResponse.error(res, 400, 'Invalid deposit source');
  }

  // Make deposit
  await wallet.deposit(amount, source, transactionId, note);

  return ApiResponse.success(res, 200, 'Deposit successful', {
    wallet,
    deposit: wallet.deposits[wallet.deposits.length - 1],
    achievements: wallet.gamification.achievements
  });
});

/**
 * Initiate M-Pesa STK Push deposit
 * POST /api/v1/rent-wallets/deposit/mpesa
 */
export const initiateMpesaDeposit = catchAsync(async (req, res) => {
  const { amount, phoneNumber } = req.body;

  // Validate inputs
  if (!amount || amount < 10) {
    return ApiResponse.error(res, 400, 'Minimum deposit amount is KES 10');
  }

  if (!phoneNumber) {
    return ApiResponse.error(res, 400, 'Phone number is required');
  }

  // Get or create user's wallet
  let wallet = await RentWallet.findOne({
    userId: req.user._id,
    status: 'active'
  });

  if (!wallet) {
    // Create wallet if doesn't exist
    wallet = await RentWallet.create({
      userId: req.user._id,
      targetAmount: 0,
      walletType: 'rent_savings'
    });
  }

  // Create pending payment record
  const payment = await Payment.create({
    tenantId: req.user._id,
    landlordId: req.user._id, // For wallet deposits, tenant is also the landlord
    walletId: wallet._id,
    amount,
    paymentMethod: 'mpesa',
    status: 'pending',
    phoneNumber,
    type: 'deposit',
    breakdown: {
      total: amount
    }
  });

  // Initiate STK Push
  const stkResult = await mpesaService.initiateSTKPush(
    phoneNumber,
    amount,
    payment._id.toString(),
    `Wallet Deposit - KES ${amount}`
  );

  if (!stkResult.success) {
    // Update payment status to failed
    payment.status = 'failed';
    payment.errorMessage = stkResult.error;
    await payment.save();

    return ApiResponse.error(res, 400, stkResult.error || 'Failed to initiate M-Pesa payment');
  }

  // Update payment with M-Pesa details
  payment.mpesaCheckoutRequestId = stkResult.checkoutRequestId;
  payment.mpesaMerchantRequestId = stkResult.merchantRequestId;
  await payment.save();

  return ApiResponse.success(res, 200, 'STK Push initiated. Please check your phone to complete payment', {
    checkoutRequestId: stkResult.checkoutRequestId,
    merchantRequestId: stkResult.merchantRequestId,
    customerMessage: stkResult.customerMessage,
    paymentId: payment._id
  });
});

/**
 * Request withdrawal
 * POST /api/v1/rent-wallets/:id/withdraw
 */
export const requestWithdrawal = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { amount, reason, withdrawalMethod } = req.body;

  if (!amount || amount <= 0) {
    return ApiResponse.error(res, 400, 'Valid withdrawal amount is required');
  }

  const wallet = await RentWallet.findById(id);

  if (!wallet) {
    return ApiResponse.notFound(res, 'Wallet not found');
  }

  // Check ownership
  if (wallet.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only withdraw from your own wallet');
  }

  if (amount > wallet.balance) {
    return ApiResponse.error(res, 400, 'Insufficient balance');
  }

  // Request withdrawal
  const withdrawal = await wallet.requestWithdrawal(amount, reason, withdrawalMethod);

  return ApiResponse.success(res, 200, 'Withdrawal request submitted. Processing takes 24 hours.', {
    withdrawal,
    balance: wallet.balance
  });
});

/**
 * Complete withdrawal (Admin or automated process)
 * PUT /api/v1/rent-wallets/:id/withdrawals/:withdrawalId/complete
 */
export const completeWithdrawal = catchAsync(async (req, res) => {
  const { id, withdrawalId } = req.params;

  const wallet = await RentWallet.findById(id);

  if (!wallet) {
    return ApiResponse.notFound(res, 'Wallet not found');
  }

  // Complete withdrawal
  await wallet.completeWithdrawal(withdrawalId);

  return ApiResponse.success(res, 200, 'Withdrawal completed successfully', {
    wallet,
    withdrawal: wallet.withdrawals.id(withdrawalId)
  });
});

/**
 * Set up auto-save rules
 * PUT /api/v1/rent-wallets/:id/auto-save
 */
export const setupAutoSave = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { frequency, amount, dayOfWeek, dayOfMonth, time } = req.body;

  const wallet = await RentWallet.findById(id);

  if (!wallet) {
    return ApiResponse.notFound(res, 'Wallet not found');
  }

  // Check ownership
  if (wallet.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only modify your own wallet');
  }

  // Validate frequency
  const validFrequencies = ['daily', 'weekly', 'monthly'];
  if (!frequency || !validFrequencies.includes(frequency)) {
    return ApiResponse.error(res, 400, 'Valid frequency is required (daily, weekly, monthly)');
  }

  if (!amount || amount < 10) {
    return ApiResponse.error(res, 400, 'Auto-save amount must be at least KES 10');
  }

  // Set up auto-save rule
  wallet.autoSaveRules = {
    enabled: true,
    frequency,
    amount,
    dayOfWeek,
    dayOfMonth,
    time,
    lastExecuted: null
  };

  await wallet.save();

  return ApiResponse.success(res, 200, 'Auto-save rules configured successfully', {
    autoSaveRules: wallet.autoSaveRules
  });
});

/**
 * Disable auto-save
 * DELETE /api/v1/rent-wallets/:id/auto-save
 */
export const disableAutoSave = catchAsync(async (req, res) => {
  const { id } = req.params;

  const wallet = await RentWallet.findById(id);

  if (!wallet) {
    return ApiResponse.notFound(res, 'Wallet not found');
  }

  // Check ownership
  if (wallet.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only modify your own wallet');
  }

  wallet.autoSaveRules.enabled = false;
  await wallet.save();

  return ApiResponse.success(res, 200, 'Auto-save disabled successfully');
});

/**
 * Pay rent from wallet
 * POST /api/v1/rent-wallets/:id/pay-rent
 */
export const payRentFromWallet = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { amount, leaseId } = req.body;

  if (!amount || !leaseId) {
    return ApiResponse.error(res, 400, 'Amount and lease ID are required');
  }

  const wallet = await RentWallet.findById(id);

  if (!wallet) {
    return ApiResponse.notFound(res, 'Wallet not found');
  }

  // Check ownership
  if (wallet.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only use your own wallet');
  }

  // Verify lease exists and belongs to user
  const lease = await Lease.findById(leaseId);
  if (!lease) {
    return ApiResponse.notFound(res, 'Lease not found');
  }

  if (lease.tenantId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only pay for your own lease');
  }

  if (amount > wallet.balance) {
    return ApiResponse.error(res, 400, 'Insufficient wallet balance');
  }

  // Pay rent from wallet
  const payment = await wallet.payRentFromWallet(amount, leaseId);

  return ApiResponse.success(res, 200, 'Rent payment successful', {
    payment,
    remainingBalance: wallet.balance
  });
});

/**
 * Get wallet statistics
 * GET /api/v1/rent-wallets/:id/statistics
 */
export const getWalletStatistics = catchAsync(async (req, res) => {
  const { id } = req.params;

  const wallet = await RentWallet.findById(id);

  if (!wallet) {
    return ApiResponse.notFound(res, 'Wallet not found');
  }

  // Check access permissions
  if (req.user.role !== 'admin' && wallet.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only access your own wallet statistics');
  }

  // Calculate statistics
  const totalDeposits = wallet.deposits.reduce((sum, d) => sum + d.amount, 0);
  const totalWithdrawals = wallet.withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const averageDepositAmount = wallet.deposits.length > 0
    ? totalDeposits / wallet.deposits.length
    : 0;

  const depositsBySource = wallet.deposits.reduce((acc, d) => {
    acc[d.source] = (acc[d.source] || 0) + d.amount;
    return acc;
  }, {});

  const progress = {
    percentage: Math.round((wallet.balance / wallet.targetAmount) * 100),
    remaining: wallet.targetAmount - wallet.balance,
    projectedCompletion: wallet.projectedCompletionDate
  };

  const statistics = {
    balance: wallet.balance,
    targetAmount: wallet.targetAmount,
    totalDeposits,
    totalWithdrawals,
    depositCount: wallet.deposits.length,
    withdrawalCount: wallet.withdrawals.length,
    averageDepositAmount: Math.round(averageDepositAmount),
    depositsBySource,
    progress,
    gamification: {
      currentStreak: wallet.gamification.currentStreak,
      longestStreak: wallet.gamification.longestStreak,
      totalBonusesEarned: wallet.gamification.bonusesEarned.reduce((sum, b) => sum + b.amount, 0),
      achievementsUnlocked: wallet.gamification.achievements.length
    }
  };

  return ApiResponse.success(res, 200, 'Wallet statistics retrieved successfully', { statistics });
});

/**
 * Get top savers leaderboard
 * GET /api/v1/rent-wallets/leaderboard
 */
export const getLeaderboard = catchAsync(async (req, res) => {
  const { period = 'month', limit = 10 } = req.query;

  const validPeriods = ['week', 'month', 'all'];
  if (!validPeriods.includes(period)) {
    return ApiResponse.error(res, 400, 'Valid period is required (week, month, all)');
  }

  const topSavers = await RentWallet.getTopSavers(Number(limit), period);

  return ApiResponse.success(res, 200, 'Leaderboard retrieved successfully', {
    period,
    topSavers
  });
});

/**
 * Calculate interest for all wallets (Cron job - Admin only)
 * POST /api/v1/rent-wallets/calculate-interest
 */
export const calculateInterestForAll = catchAsync(async (req, res) => {
  const wallets = await RentWallet.find({ status: 'active' });

  const results = [];

  for (const wallet of wallets) {
    const interestEarned = await wallet.calculateInterest();
    if (interestEarned > 0) {
      results.push({
        walletId: wallet._id,
        userId: wallet.userId,
        interestEarned,
        newBalance: wallet.balance
      });
    }
  }

  return ApiResponse.success(res, 200, 'Interest calculated for all wallets', {
    walletsProcessed: wallets.length,
    walletsWithInterest: results.length,
    results
  });
});

/**
 * Close wallet
 * DELETE /api/v1/rent-wallets/:id
 */
export const closeWallet = catchAsync(async (req, res) => {
  const { id } = req.params;

  const wallet = await RentWallet.findById(id);

  if (!wallet) {
    return ApiResponse.notFound(res, 'Wallet not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && wallet.userId.toString() !== req.user._id.toString()) {
    return ApiResponse.forbidden(res, 'You can only close your own wallet');
  }

  if (wallet.balance > 0) {
    return ApiResponse.error(res, 400, 'Cannot close wallet with remaining balance. Please withdraw all funds first.');
  }

  wallet.status = 'closed';
  await wallet.save();

  return ApiResponse.success(res, 200, 'Wallet closed successfully');
});

export default {
  createRentWallet,
  getMyWallet,
  getWalletById,
  depositToWallet,
  requestWithdrawal,
  completeWithdrawal,
  setupAutoSave,
  disableAutoSave,
  payRentFromWallet,
  getWalletStatistics,
  getLeaderboard,
  calculateInterestForAll,
  closeWallet
};
