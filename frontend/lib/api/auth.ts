import { apiClient } from './client';
import { User, APIResponse } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'tenant' | 'landlord';
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<APIResponse<{ user: User; token: string }>> => {
    return apiClient.post('/auth/login', credentials);
  },

  register: async (data: RegisterData): Promise<APIResponse<{ user: User; token: string }>> => {
    return apiClient.post('/auth/register', data);
  },

  logout: async (): Promise<APIResponse<null>> => {
    return apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<APIResponse<User>> => {
    return apiClient.get('/auth/me');
  },

  forgotPassword: async (email: string): Promise<APIResponse<null>> => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<APIResponse<null>> => {
    return apiClient.post(`/auth/reset-password/${token}`, { password });
  },
};
