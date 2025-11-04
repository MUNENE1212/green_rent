'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { walletAPI } from '@/lib/api/wallet';
import { bookingAPI } from '@/lib/api/bookings';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [walletBalance, setWalletBalance] = useState(0);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect admins to admin dashboard
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
        return;
      }
      // Redirect landlords to their dashboard
      if (user.role === 'landlord') {
        router.push('/landlord/dashboard');
        return;
      }
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [walletResponse, bookingsResponse] = await Promise.all([
        walletAPI.getWallet().catch(() => ({ data: { balance: 0 } })),
        bookingAPI.getMyBookings().catch(() => ({ data: [] })),
      ]);

      if (walletResponse.data) {
        setWalletBalance(walletResponse.data.balance || 0);
      }

      if (bookingsResponse.data) {
        setRecentBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data.slice(0, 3) : []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your dashboard</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}! 👋</h1>
          <p className="text-primary-100">Here's what's happening with your account</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Wallet Balance */}
          <Link href="/wallet" className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-xs text-gray-500">View Wallet →</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Wallet Balance</h3>
            <div className="text-3xl font-bold text-primary-600">
              {loading ? (
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                `KES ${walletBalance.toLocaleString()}`
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Available for rent payments</p>
          </Link>

          {/* Active Bookings */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Bookings</h3>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                recentBookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Scheduled viewings</p>
          </div>

          {/* Properties Saved */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">❤️</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Saved Properties</h3>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <p className="text-xs text-gray-500 mt-2">Your favorites</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Recent Activity */}
          <div className="md:col-span-2 space-y-6">
            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
                <Link href="/bookings" className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
                  View All →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {typeof booking.property === 'object' ? booking.property.name : 'Property Viewing'}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {booking.type === 'virtual' ? '🎥 Virtual' : '🏠 Physical'} Viewing
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-gray-600 mb-4">No bookings yet</p>
                  <Link
                    href="/properties"
                    className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    Browse Properties
                  </Link>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                <Link href="/payments" className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
                  View All →
                </Link>
              </div>

              <div className="text-center py-12">
                <div className="text-4xl mb-3">💳</div>
                <p className="text-gray-600 mb-2">No payment history yet</p>
                <p className="text-sm text-gray-500">Your transactions will appear here</p>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/properties"
                  className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center px-4 py-3 rounded-lg font-semibold transition"
                >
                  Browse Properties
                </Link>
                <Link
                  href="/wallet"
                  className="block w-full bg-white hover:bg-gray-50 text-primary-600 border-2 border-primary-600 text-center px-4 py-3 rounded-lg font-semibold transition"
                >
                  Add to Wallet
                </Link>
                <Link
                  href="/bookings"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-center px-4 py-3 rounded-lg font-semibold transition"
                >
                  My Bookings
                </Link>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="bg-primary-50 rounded-xl shadow-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Complete Your Profile</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Profile Completion</span>
                  <span className="font-semibold text-primary-600">
                    {user?.isEmailVerified ? '80%' : '60%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: user?.isEmailVerified ? '80%' : '60%' }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className={user?.isEmailVerified ? 'text-green-600' : 'text-gray-400'}>
                    {user?.isEmailVerified ? '✓' : '○'}
                  </span>
                  <span className="ml-2 text-gray-700">Email Verified</span>
                </div>
                <div className="flex items-center">
                  <span className={user?.isPhoneVerified ? 'text-green-600' : 'text-gray-400'}>
                    {user?.isPhoneVerified ? '✓' : '○'}
                  </span>
                  <span className="ml-2 text-gray-700">Phone Verified</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400">○</span>
                  <span className="ml-2 text-gray-700">Profile Photo</span>
                </div>
              </div>
              <Link
                href="/profile"
                className="block w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white text-center px-4 py-2 rounded-lg font-semibold transition text-sm"
              >
                Complete Profile
              </Link>
            </div>

            {/* Tips & Help */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">💡 Pro Tip</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save at least KES 100 daily in your wallet to reach your rent goal faster!
              </p>
              <Link
                href="/how-it-works"
                className="text-primary-600 hover:text-primary-700 text-sm font-semibold"
              >
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
