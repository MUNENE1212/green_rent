'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { walletAPI } from '@/lib/api/wallet';
import { RentWallet } from '@/types';

export default function WalletPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [wallet, setWallet] = useState<RentWallet | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'mpesa' | 'card' | 'bank_transfer'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletData();
    }
  }, [isAuthenticated]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletResponse, transactionsResponse] = await Promise.all([
        walletAPI.getWallet().catch(() => ({ data: null })),
        walletAPI.getTransactions().catch(() => ({ data: [] })),
      ]);

      if (walletResponse.data) {
        setWallet(walletResponse.data);
      }

      if (transactionsResponse.data) {
        setTransactions(Array.isArray(transactionsResponse.data) ? transactionsResponse.data : []);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await walletAPI.deposit({
        amount: Number(depositAmount),
        paymentMethod: depositMethod,
        phoneNumber: depositMethod === 'mpesa' ? phoneNumber : undefined,
      });
      setShowDepositModal(false);
      setDepositAmount('');
      setPhoneNumber('');
      fetchWalletData();
      alert('Deposit initiated successfully!');
    } catch (error) {
      console.error('Error depositing:', error);
      alert('Failed to initiate deposit. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your wallet</p>
          <Link
            href="/auth/login"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const savingsProgress = wallet?.savingsGoal
    ? ((wallet.balance / wallet.savingsGoal) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">💰 My Rent Wallet</h1>
          <p className="text-primary-100">Save for your rent, your way</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-primary-100 mb-2">Available Balance</p>
              {loading ? (
                <div className="h-12 w-48 bg-primary-500 rounded animate-pulse"></div>
              ) : (
                <h2 className="text-5xl font-bold">KES {wallet?.balance.toLocaleString() || '0'}</h2>
              )}
            </div>
            <button
              onClick={() => setShowDepositModal(true)}
              className="bg-white text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-lg font-semibold transition"
            >
              + Deposit
            </button>
          </div>

          {/* Savings Goal Progress */}
          {wallet?.savingsGoal && (
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Savings Goal Progress</span>
                <span className="font-semibold">{savingsProgress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                <div
                  className="bg-accent-400 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(Number(savingsProgress), 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-primary-100">
                <span>KES {wallet.balance.toLocaleString()}</span>
                <span>Goal: KES {wallet.savingsGoal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-primary-100 text-sm mb-1">Total Deposited</p>
              <p className="text-xl font-bold">KES {wallet?.totalDeposited.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-primary-100 text-sm mb-1">Total Withdrawn</p>
              <p className="text-xl font-bold">KES {wallet?.totalWithdrawn.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-primary-100 text-sm mb-1">Auto-Save</p>
              <p className="text-xl font-bold">{wallet?.autoSaveEnabled ? 'On' : 'Off'}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Transactions */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h2>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 w-24 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            transaction.type === 'deposit'
                              ? 'bg-green-100'
                              : 'bg-red-100'
                          }`}
                        >
                          <span className="text-xl">
                            {transaction.type === 'deposit' ? '💰' : '💸'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {transaction.type.replace('_', ' ')}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            transaction.type === 'deposit'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'deposit' ? '+' : '-'} KES{' '}
                          {transaction.amount.toLocaleString()}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-gray-600 mb-2">No transactions yet</p>
                  <p className="text-sm text-gray-500">Your transaction history will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center px-4 py-3 rounded-lg font-semibold transition"
                >
                  💰 Deposit Money
                </button>
                <button className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-center px-4 py-3 rounded-lg font-semibold transition">
                  💸 Withdraw Funds
                </button>
                <button className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-center px-4 py-3 rounded-lg font-semibold transition">
                  ⚙️ Auto-Save Settings
                </button>
              </div>
            </div>

            {/* Savings Tips */}
            <div className="bg-primary-50 rounded-xl shadow-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">💡 Savings Tips</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Save KES 100 daily = KES 3,000 monthly</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Enable auto-save for consistent growth</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Set a monthly savings goal</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Use for deposit when booking</span>
                </li>
              </ul>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📱</span>
                    <div>
                      <p className="font-semibold text-sm">M-Pesa</p>
                      <p className="text-xs text-gray-500">Instant deposit</p>
                    </div>
                  </div>
                  <span className="text-green-600 text-xs">✓ Active</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg opacity-50">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💳</span>
                    <div>
                      <p className="font-semibold text-sm">Card</p>
                      <p className="text-xs text-gray-500">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Deposit Money</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES)</label>
                <input
                  type="number"
                  required
                  min="10"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum: KES 10</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card (Coming Soon)</option>
                  <option value="bank_transfer">Bank Transfer (Coming Soon)</option>
                </select>
              </div>

              {depositMethod === 'mpesa' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="254XXXXXXXXX"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Continue to Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
