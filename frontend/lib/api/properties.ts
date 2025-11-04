import { apiClient } from './client';
import { Property, Unit, PaginatedResponse, APIResponse } from '@/types';

export interface PropertyFilters {
  type?: string;
  city?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  page?: number;
  limit?: number;
}

export const propertyAPI = {
  getProperties: async (filters?: PropertyFilters): Promise<PaginatedResponse<Property>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiClient.get(`/properties?${params.toString()}`);
  },

  getProperty: async (id: string): Promise<APIResponse<Property>> => {
    return apiClient.get(`/properties/${id}`);
  },

  getPropertyUnits: async (propertyId: string): Promise<APIResponse<Unit[]>> => {
    return apiClient.get(`/properties/${propertyId}/units`);
  },

  searchProperties: async (query: string): Promise<PaginatedResponse<Property>> => {
    return apiClient.get(`/properties/search?q=${encodeURIComponent(query)}`);
  },

  // Landlord-specific endpoints
  getMyProperties: async (landlordId: string): Promise<APIResponse<Property[]>> => {
    return apiClient.get(`/properties/landlord/${landlordId}`);
  },

  createProperty: async (data: Partial<Property>): Promise<APIResponse<Property>> => {
    return apiClient.post('/properties', data);
  },

  updateProperty: async (id: string, data: Partial<Property>): Promise<APIResponse<Property>> => {
    return apiClient.patch(`/properties/${id}`, data);
  },

  deleteProperty: async (id: string): Promise<APIResponse<null>> => {
    return apiClient.delete(`/properties/${id}`);
  },

  getPropertyStats: async (id: string): Promise<APIResponse<any>> => {
    return apiClient.get(`/properties/${id}/stats`);
  },
};

export const unitAPI = {
  getUnit: async (id: string): Promise<APIResponse<Unit>> => {
    return apiClient.get(`/units/${id}`);
  },

  getAvailableUnits: async (filters?: PropertyFilters): Promise<PaginatedResponse<Unit>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiClient.get(`/units/available?${params.toString()}`);
  },

  // Landlord-specific unit endpoints
  createUnit: async (data: Partial<Unit>): Promise<APIResponse<Unit>> => {
    return apiClient.post('/units', data);
  },

  updateUnit: async (id: string, data: Partial<Unit>): Promise<APIResponse<Unit>> => {
    return apiClient.patch(`/units/${id}`, data);
  },

  deleteUnit: async (id: string): Promise<APIResponse<null>> => {
    return apiClient.delete(`/units/${id}`);
  },
};
