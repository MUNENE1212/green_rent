import { apiClient } from './client';
import { Booking, APIResponse } from '@/types';

export interface CreateBookingData {
  property: string;
  unit: string;
  type: 'physical' | 'virtual';
  scheduledDate: string;
  notes?: string;
}

export const bookingAPI = {
  createBooking: async (data: CreateBookingData): Promise<APIResponse<Booking>> => {
    return apiClient.post('/bookings', data);
  },

  getMyBookings: async (): Promise<APIResponse<Booking[]>> => {
    // Backend filters by user role automatically
    return apiClient.get('/bookings');
  },

  getBooking: async (id: string): Promise<APIResponse<Booking>> => {
    return apiClient.get(`/bookings/${id}`);
  },

  cancelBooking: async (id: string, reason?: string): Promise<APIResponse<Booking>> => {
    return apiClient.put(`/bookings/${id}/cancel`, { reason });
  },
};
