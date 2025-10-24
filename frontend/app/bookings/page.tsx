'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { bookingAPI } from '@/lib/api/bookings';
import { Booking } from '@/types';

export default function BookingsPage() {
  const { isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getMyBookings();
      if (response.success && response.data) {
        setBookings(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingAPI.cancelBooking(bookingId);
      alert('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.scheduledDate);
    const now = new Date();

    if (filter === 'upcoming') {
      return bookingDate >= now && booking.status !== 'cancelled' && booking.status !== 'completed';
    } else if (filter === 'past') {
      return bookingDate < now || booking.status === 'completed' || booking.status === 'cancelled';
    }
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your bookings</p>
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
          <h1 className="text-3xl font-bold mb-2">📅 My Bookings</h1>
          <p className="text-primary-100">Manage your property viewings</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-card p-2 mb-6 inline-flex">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === 'upcoming'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === 'past'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Past
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-card p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-xl shadow-card p-6 hover:shadow-card-hover transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">
                        {booking.type === 'virtual' ? '🎥' : '🏠'}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {typeof booking.property === 'object'
                            ? booking.property.name
                            : 'Property Viewing'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {booking.type === 'virtual' ? 'Virtual Tour' : 'Physical Visit'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">📅</span>
                        <span>
                          {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">🕐</span>
                        <span>
                          {new Date(booking.scheduledDate).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {booking.notes && (
                        <div className="flex items-start text-gray-600">
                          <span className="mr-2">📝</span>
                          <span>{booking.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : booking.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>

                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <div className="flex gap-2">
                        {typeof booking.property === 'object' && (
                          <Link
                            href={`/properties/${booking.property._id}`}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition text-sm"
                          >
                            View Property
                          </Link>
                        )}
                        <button
                          onClick={() => handleCancel(booking._id)}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === 'upcoming'
                ? 'No Upcoming Bookings'
                : filter === 'past'
                ? 'No Past Bookings'
                : 'No Bookings Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Start exploring properties and schedule viewings'
                : `You don't have any ${filter} bookings`}
            </p>
            <Link
              href="/properties"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Browse Properties
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
