'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { propertyAPI } from '@/lib/api/properties';
import { Property } from '@/types';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    city: '',
    minRent: '',
    maxRent: '',
    bedrooms: '',
    search: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyAPI.getProperties({
        ...(filters.type && { type: filters.type }),
        ...(filters.city && { city: filters.city }),
        ...(filters.minRent && { minRent: Number(filters.minRent) }),
        ...(filters.maxRent && { maxRent: Number(filters.maxRent) }),
        ...(filters.bedrooms && { bedrooms: Number(filters.bedrooms) }),
      });

      if (response.success && response.data) {
        setProperties(response.data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Find Your Perfect Home</h1>
          <p className="text-xl text-primary-100">
            Browse through our collection of quality rental properties
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white shadow-md sticky top-16 z-40">
        <div className="container mx-auto px-4 py-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by location, property name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="commercial">Commercial</option>
              </select>

              <input
                type="text"
                placeholder="City"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />

              <input
                type="number"
                placeholder="Min Rent (KES)"
                value={filters.minRent}
                onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />

              <input
                type="number"
                placeholder="Max Rent (KES)"
                value={filters.maxRent}
                onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />

              <select
                value={filters.bedrooms}
                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">Bedrooms</option>
                <option value="1">1 Bed</option>
                <option value="2">2 Beds</option>
                <option value="3">3 Beds</option>
                <option value="4">4+ Beds</option>
              </select>
            </div>
          </form>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-card animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link
                href={`/properties/${property._id}`}
                key={property._id}
                className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1"
              >
                {/* Property Image */}
                <div className="relative h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <span className="text-6xl">🏠</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {property.availableUnits} Available
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{property.name}</h3>
                  <p className="text-gray-600 mb-3 flex items-center">
                    <span className="mr-2">📍</span>
                    {property.address.city}, {property.address.state}
                  </p>
                  <p className="text-gray-700 mb-4 line-clamp-2">{property.description}</p>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-500">Starting from</span>
                      <div className="text-2xl font-bold text-primary-600">
                        KES {property.averageRent?.toLocaleString() || 'N/A'}
                        <span className="text-sm text-gray-500">/month</span>
                      </div>
                    </div>
                    <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                      {property.type}
                    </div>
                  </div>

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.slice(0, 3).map((amenity, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{property.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any properties matching your criteria. Try adjusting your filters.
            </p>
            <button
              onClick={() => {
                setFilters({
                  type: '',
                  city: '',
                  minRent: '',
                  maxRent: '',
                  bedrooms: '',
                  search: '',
                });
                fetchProperties();
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
