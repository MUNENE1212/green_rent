'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { propertyAPI } from '@/lib/api/properties';
import { apiClient } from '@/lib/api/client';

interface Landlord {
  _id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

interface PropertyFormData {
  name: string;
  description: string;
  propertyType: string;
  landlordId: string;
  location: {
    address: {
      street: string;
      area: string;
      city: string;
      county: string;
      postalCode: string;
    };
    coordinates: {
      type: string;
      coordinates: [number, number];
    };
  };
  amenities: {
    security: string[];
    utilities: string[];
    facilities: string[];
    services: string[];
  };
  utilities: {
    water: string;
    electricity: string;
    internet: string;
    garbage: string;
  };
  managementDetails: {
    propertyManager: string;
    maintenanceContact: string;
    emergencyContact: string;
  };
  policies: {
    petPolicy: string;
    smokingPolicy: string;
    guestPolicy: string;
    parkingPolicy: string;
  };
}

export default function AdminNewPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    description: '',
    propertyType: 'apartment',
    landlordId: searchParams.get('landlordId') || '',
    location: {
      address: {
        street: '',
        area: '',
        city: '',
        county: '',
        postalCode: '',
      },
      coordinates: {
        type: 'Point',
        coordinates: [36.8219, -1.2921],
      },
    },
    amenities: {
      security: [],
      utilities: [],
      facilities: [],
      services: [],
    },
    utilities: {
      water: 'included',
      electricity: 'tenant',
      internet: 'tenant',
      garbage: 'included',
    },
    managementDetails: {
      propertyManager: '',
      maintenanceContact: '',
      emergencyContact: '',
    },
    policies: {
      petPolicy: 'not_allowed',
      smokingPolicy: 'not_allowed',
      guestPolicy: 'allowed',
      parkingPolicy: 'available',
    },
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLandlords();
    }
  }, [user]);

  const fetchLandlords = async () => {
    try {
      const response = await apiClient.get('/users?role=landlord');
      if (response.data) {
        const landlordsData = Array.isArray(response.data) ? response.data : response.data.users || [];
        setLandlords(landlordsData);
      }
    } catch (error) {
      console.error('Failed to fetch landlords:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current: any = newData;

        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (category: keyof PropertyFormData['amenities'], value: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [category]: prev.amenities[category].includes(value)
          ? prev.amenities[category].filter(item => item !== value)
          : [...prev.amenities[category], value],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.landlordId) {
      alert('Please select a landlord');
      return;
    }

    try {
      setLoading(true);
      const response = await propertyAPI.createProperty(formData);

      if (response.success) {
        alert('Property created successfully for the landlord!');
        router.push('/admin/landlords');
      }
    } catch (error: any) {
      console.error('Error creating property:', error);
      alert(error.message || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add Property for Landlord</h1>
          <p className="text-gray-600 mt-2">Create a property listing on behalf of a landlord</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Landlord Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Landlord</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landlord *
              </label>
              <select
                name="landlordId"
                value={formData.landlordId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a landlord</option>
                {landlords.map(landlord => (
                  <option key={landlord._id} value={landlord._id}>
                    {landlord.profile.firstName} {landlord.profile.lastName} ({landlord.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                The property will be assigned to this landlord
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Sunrise Apartments"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="villa">Villa</option>
                  <option value="studio">Studio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe the property..."
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="location.address.street"
                  value={formData.location.address.street}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area/Neighborhood *
                </label>
                <input
                  type="text"
                  name="location.address.area"
                  value={formData.location.address.area}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="location.address.city"
                  value={formData.location.address.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County *
                </label>
                <input
                  type="text"
                  name="location.address.county"
                  value={formData.location.address.county}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="location.address.postalCode"
                  value={formData.location.address.postalCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Security</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['CCTV', 'Security Guard', 'Gated Community', 'Electric Fence', 'Access Control'].map(item => (
                    <label key={item} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.amenities.security.includes(item)}
                        onChange={() => handleCheckboxChange('security', item)}
                        className="rounded text-primary-600"
                      />
                      <span className="text-sm text-gray-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Facilities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Parking', 'Gym', 'Pool', 'Playground', 'Elevator', 'Generator'].map(item => (
                    <label key={item} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.amenities.facilities.includes(item)}
                        onChange={() => handleCheckboxChange('facilities', item)}
                        className="rounded text-primary-600"
                      />
                      <span className="text-sm text-gray-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Auto-Approval Option */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-900">Auto-Approval</h3>
                <p className="text-sm text-green-700 mt-1">
                  As an admin, this property will be automatically approved and visible on the platform immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Property...' : 'Create & Approve Property'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
