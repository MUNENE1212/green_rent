'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { propertyAPI } from '@/lib/api/properties';
import { Property } from '@/types';

export default function LandlordPropertiesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.role === 'landlord') {
      fetchProperties();
    }
  }, [isAuthenticated, user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      if (!user?._id) {
        console.error('User ID not found');
        return;
      }
      const response = await propertyAPI.getMyProperties(user._id);

      if (response.data) {
        const propertiesData = response.data.properties || response.data;
        setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    try {
      await propertyAPI.deleteProperty(propertyId);
      setProperties(properties.filter(p => p._id !== propertyId));
      alert('Property deleted successfully');
    } catch (error: any) {
      console.error('Error deleting property:', error);
      alert(error.message || 'Failed to delete property');
    }
  };

  if (!isAuthenticated || user?.role !== 'landlord') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Landlord Access Only</h2>
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

  // Filter properties
  const filteredProperties = properties.filter(property => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && property.status === 'active') ||
      (filter === 'inactive' && property.status !== 'active');

    const matchesSearch = searchQuery === '' ||
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">🏢 My Properties</h1>
              <p className="text-primary-100">Manage all your properties in one place</p>
            </div>
            <Link
              href="/landlord/properties/new"
              className="bg-white text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-lg font-semibold transition"
            >
              + Add Property
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search properties by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({properties.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'active'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active ({properties.filter(p => p.status === 'active').length})
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'inactive'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive ({properties.filter(p => p.status !== 'active').length})
              </button>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || filter !== 'all' ? 'No properties found' : 'No properties yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Get started by adding your first property'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Link
                href="/landlord/properties/new"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Add Your First Property
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div
                key={property._id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
              >
                {/* Property Image */}
                <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl text-white">🏢</div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{property.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        property.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    📍 {property.location?.address}, {property.location?.city}
                  </p>

                  <div className="flex gap-4 text-sm text-gray-500 mb-4">
                    <span>🏢 {property.type}</span>
                    <span>🚪 {property.units?.length || 0} units</span>
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="text-sm text-gray-600">Average Rent</div>
                    <div className="text-xl font-bold text-primary-600">
                      KES {property.averageRent?.toLocaleString() || 0}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/landlord/properties/${property._id}`}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-center px-4 py-2 rounded-lg font-medium transition"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/landlord/properties/${property._id}/edit`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition"
                    >
                      ✏️
                    </Link>
                    <button
                      onClick={() => handleDeleteProperty(property._id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
