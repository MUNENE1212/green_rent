'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { propertyAPI } from '@/lib/api/properties';
import { Property } from '@/types';

export default function LandlordDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    monthlyRevenue: 0,
    pendingMaintenance: 0,
  });

  useEffect(() => {
    if (isAuthenticated && user?.role === 'landlord') {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
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

        // Calculate stats
        const totalUnits = propertiesData.reduce((sum: number, p: Property) =>
          sum + (p.units?.length || 0), 0
        );
        const occupiedUnits = propertiesData.reduce((sum: number, p: Property) =>
          sum + (p.units?.filter((u: any) => u.status === 'occupied').length || 0), 0
        );

        setStats({
          totalProperties: propertiesData.length,
          totalUnits,
          occupiedUnits,
          monthlyRevenue: 0, // TODO: Calculate from leases
          pendingMaintenance: 0, // TODO: Get from maintenance requests
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'landlord') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Landlord Access Only</h2>
          <p className="text-gray-600 mb-6">You need to be logged in as a landlord to access this page</p>
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

  const occupancyRate = stats.totalUnits > 0
    ? ((stats.occupiedUnits / stats.totalUnits) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">🏢 Landlord Dashboard</h1>
          <p className="text-primary-100">Manage your properties and tenants</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Properties */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🏠</div>
              <span className="text-sm text-gray-500">Properties</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalProperties}</div>
            <p className="text-sm text-gray-600 mt-1">Total properties</p>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📊</div>
              <span className="text-sm text-gray-500">Occupancy</span>
            </div>
            <div className="text-3xl font-bold text-primary-600">{occupancyRate}%</div>
            <p className="text-sm text-gray-600 mt-1">
              {stats.occupiedUnits} / {stats.totalUnits} units occupied
            </p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">💰</div>
              <span className="text-sm text-gray-500">Revenue</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              KES {stats.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">Monthly revenue</p>
          </div>

          {/* Pending Maintenance */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🔧</div>
              <span className="text-sm text-gray-500">Maintenance</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingMaintenance}</div>
            <p className="text-sm text-gray-600 mt-1">Pending requests</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/landlord/properties/new"
              className="flex flex-col items-center p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
            >
              <div className="text-3xl mb-2">➕</div>
              <span className="text-sm font-medium text-gray-700">Add Property</span>
            </Link>

            <Link
              href="/landlord/properties"
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
            >
              <div className="text-3xl mb-2">🏘️</div>
              <span className="text-sm font-medium text-gray-700">View Properties</span>
            </Link>

            <Link
              href="/landlord/tenants"
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
            >
              <div className="text-3xl mb-2">👥</div>
              <span className="text-sm font-medium text-gray-700">Manage Tenants</span>
            </Link>

            <Link
              href="/landlord/payments"
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
            >
              <div className="text-3xl mb-2">💳</div>
              <span className="text-sm font-medium text-gray-700">Track Payments</span>
            </Link>
          </div>
        </div>

        {/* Properties List */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">My Properties</h2>
              <Link
                href="/landlord/properties/new"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                + Add Property
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties yet</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first property</p>
              <Link
                href="/landlord/properties/new"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Add Your First Property
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {properties.map((property) => (
                <Link
                  key={property._id}
                  href={`/landlord/properties/${property._id}`}
                  className="block p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {property.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        📍 {property.location?.address}, {property.location?.city}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>🏢 {property.type}</span>
                        <span>🚪 {property.units?.length || 0} units</span>
                        <span className="capitalize">
                          📊 {property.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        KES {property.averageRent?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-500">avg. rent</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
