/**
 * Rent Wallet Routes
 * Handles micro-savings wallet operations, deposits, withdrawals, and gamification
 */

import express from 'express';
import {
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
} from '../controllers/rentWallet.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Public routes
 */

/**
 * @route   GET /api/v1/rent-wallets/leaderboard
 * @desc    Get top savers leaderboard for gamification
 * @access  Public
 * @query   { period?: 'week'|'month'|'all', limit?: number }
 */
router.get('/leaderboard', getLeaderboard);

/**
 * Protected routes (require authentication)
 */
router.use(protect);

/**
 * @route   GET /api/v1/rent-wallets/me
 * @desc    Get current user's rent wallet
 * @access  Private (Tenant)
 */
router.get('/me', authorize('tenant'), getMyWallet);

/**
 * @route   POST /api/v1/rent-wallets
 * @desc    Create new rent wallet
 * @access  Private (Tenant)
 * @body    { targetAmount: number, walletType?: string, linkedLeaseId?: string, autoSaveRules?: object }
 */
router.post('/', authorize('tenant'), createRentWallet);

/**
 * @route   POST /api/v1/rent-wallets/calculate-interest
 * @desc    Calculate interest for all active wallets (Cron job)
 * @access  Private (Admin only)
 */
router.post('/calculate-interest', authorize('admin'), calculateInterestForAll);

/**
 * @route   GET /api/v1/rent-wallets/:id
 * @desc    Get wallet by ID
 * @access  Private (Own wallet or Admin)
 */
router.get('/:id', getWalletById);

/**
 * @route   POST /api/v1/rent-wallets/:id/deposit
 * @desc    Deposit money to wallet (minimum KES 10)
 * @access  Private (Own wallet)
 * @body    { amount: number, source: 'mpesa'|'card'|'bank_transfer'|'wallet', transactionId?: string, note?: string }
 */
router.post('/:id/deposit', depositToWallet);

/**
 * @route   POST /api/v1/rent-wallets/:id/withdraw
 * @desc    Request withdrawal from wallet (24-hour processing)
 * @access  Private (Own wallet)
 * @body    { amount: number, reason?: string, withdrawalMethod?: string }
 */
router.post('/:id/withdraw', requestWithdrawal);

/**
 * @route   PUT /api/v1/rent-wallets/:id/withdrawals/:withdrawalId/complete
 * @desc    Complete pending withdrawal
 * @access  Private (Admin only)
 */
router.put('/:id/withdrawals/:withdrawalId/complete', authorize('admin'), completeWithdrawal);

/**
 * @route   PUT /api/v1/rent-wallets/:id/auto-save
 * @desc    Set up auto-save rules
 * @access  Private (Own wallet)
 * @body    { frequency: 'daily'|'weekly'|'monthly', amount: number, dayOfWeek?: number, dayOfMonth?: number, time?: string }
 */
router.put('/:id/auto-save', setupAutoSave);

/**
 * @route   DELETE /api/v1/rent-wallets/:id/auto-save
 * @desc    Disable auto-save
 * @access  Private (Own wallet)
 */
router.delete('/:id/auto-save', disableAutoSave);

/**
 * @route   POST /api/v1/rent-wallets/:id/pay-rent
 * @desc    Pay rent from wallet balance
 * @access  Private (Own wallet)
 * @body    { amount: number, leaseId: string }
 */
router.post('/:id/pay-rent', payRentFromWallet);

/**
 * @route   GET /api/v1/rent-wallets/:id/statistics
 * @desc    Get wallet statistics and analytics
 * @access  Private (Own wallet or Admin)
 */
router.get('/:id/statistics', getWalletStatistics);

/**
 * @route   DELETE /api/v1/rent-wallets/:id
 * @desc    Close wallet (must have zero balance)
 * @access  Private (Own wallet or Admin)
 */
router.delete('/:id', closeWallet);

export default router;
