'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { propertyAPI } from '@/lib/api/properties';

interface PropertyFormData {
  name: string;
  description: string;
  propertyType: string;
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

export default function NewPropertyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    description: '',
    propertyType: 'apartment',
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
        coordinates: [36.8219, -1.2921], // Default to Nairobi
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle nested fields
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

    try {
      setLoading(true);
      const response = await propertyAPI.createProperty(formData);

      if (response.success) {
        alert('Property created successfully! It will be reviewed by our admin team.');
        router.push('/landlord/properties');
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
          <p className="text-gray-600 mt-2">Fill in the details to list your property</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                  placeholder="Describe your property..."
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

          {/* Utilities */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Utilities</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(formData.utilities).map(utility => (
                <div key={utility}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {utility}
                  </label>
                  <select
                    name={`utilities.${utility}`}
                    value={formData.utilities[utility as keyof typeof formData.utilities]}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="included">Included in rent</option>
                    <option value="tenant">Tenant pays separately</option>
                    <option value="shared">Shared cost</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Policies */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Policies</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pet Policy
                </label>
                <select
                  name="policies.petPolicy"
                  value={formData.policies.petPolicy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="allowed">Allowed</option>
                  <option value="not_allowed">Not Allowed</option>
                  <option value="negotiable">Negotiable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Smoking Policy
                </label>
                <select
                  name="policies.smokingPolicy"
                  value={formData.policies.smokingPolicy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="allowed">Allowed</option>
                  <option value="not_allowed">Not Allowed</option>
                  <option value="outdoor_only">Outdoor Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parking Policy
                </label>
                <select
                  name="policies.parkingPolicy"
                  value={formData.policies.parkingPolicy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="not_available">Not Available</option>
                  <option value="paid">Paid Parking</option>
                </select>
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
              {loading ? 'Creating Property...' : 'Create Property'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-sm text-gray-600 text-center">
            * Your property will be reviewed by our admin team before being listed publicly
          </p>
        </form>
      </div>
    </div>
  );
}
