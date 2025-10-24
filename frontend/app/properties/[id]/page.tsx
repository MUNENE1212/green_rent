'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { propertyAPI } from '@/lib/api/properties';
import { bookingAPI } from '@/lib/api/bookings';
import { useAuthStore } from '@/lib/store/authStore';
import { Property, Unit } from '@/types';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingType, setBookingType] = useState<'physical' | 'virtual'>('virtual');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchPropertyDetails();
    }
  }, [params.id]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const [propertyResponse, unitsResponse] = await Promise.all([
        propertyAPI.getProperty(params.id as string),
        propertyAPI.getPropertyUnits(params.id as string),
      ]);

      if (propertyResponse.success && propertyResponse.data) {
        setProperty(propertyResponse.data);
      }

      if (unitsResponse.success && unitsResponse.data) {
        setUnits(Array.isArray(unitsResponse.data) ? unitsResponse.data : []);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!selectedUnit || !property) {
      alert('Please select a unit');
      return;
    }

    try {
      await bookingAPI.createBooking({
        property: property._id,
        unit: selectedUnit._id,
        type: bookingType,
        scheduledDate: bookingDate,
        notes: bookingNotes,
      });

      alert('Booking created successfully!');
      setShowBookingModal(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200"></div>
          <div className="container mx-auto px-4 py-8">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h2>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist</p>
          <Link
            href="/properties"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery */}
      <div className="relative h-96 bg-gray-200">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span className="text-8xl">🏠</span>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <Link
            href="/properties"
            className="bg-white/90 backdrop-blur text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-white transition"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Property Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
                  <p className="text-gray-600 flex items-center">
                    <span className="mr-2">📍</span>
                    {property.address.street}, {property.address.city}, {property.address.state}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-primary-600">
                    KES {property.averageRent?.toLocaleString() || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">per month</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                  {property.type}
                </span>
                <span className="text-sm text-gray-600">
                  {property.availableUnits} of {property.totalUnits} units available
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Property</h2>
              <p className="text-gray-700 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-primary-600 mr-2">✓</span>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Units */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Available Units</h2>
              {units.length > 0 ? (
                <div className="space-y-4">
                  {units
                    .filter((unit) => unit.status === 'available')
                    .map((unit) => (
                      <div
                        key={unit._id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              Unit {unit.unitNumber}
                              {unit.floor && ` - Floor ${unit.floor}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {unit.bedrooms} Bed • {unit.bathrooms} Bath • {unit.squareFeet} sq ft
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary-600">
                              KES {unit.rent.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">per month</p>
                          </div>
                        </div>

                        {unit.features && unit.features.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {unit.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setShowBookingModal(true);
                          }}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-semibold transition"
                        >
                          Book Viewing
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🏠</div>
                  <p className="text-gray-600">No units currently available</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="bg-white rounded-xl shadow-card p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Property</h3>
              <div className="space-y-3">
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition">
                  📞 Call Now
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition">
                  💬 Send Message
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition">
                  ❤️ Save Property
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Schedule a Viewing</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Choose between virtual or physical property tours
                </p>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-accent-500 hover:bg-accent-600 text-white py-3 rounded-lg font-semibold transition"
                >
                  Book Viewing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Schedule Viewing</h3>
              <button
                onClick={() => setShowBookingModal(false)}
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

            {selectedUnit && (
              <div className="bg-primary-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Selected Unit</p>
                <p className="font-semibold text-gray-900">
                  Unit {selectedUnit.unitNumber} - KES {selectedUnit.rent.toLocaleString()}/month
                </p>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Viewing Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setBookingType('virtual')}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      bookingType === 'virtual'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🎥</div>
                    <div className="font-semibold text-sm">Virtual Tour</div>
                    <div className="text-xs text-gray-600">Online viewing</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingType('physical')}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      bookingType === 'physical'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🏠</div>
                    <div className="font-semibold text-sm">Physical Visit</div>
                    <div className="text-xs text-gray-600">In-person tour</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Any special requirements or questions..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
