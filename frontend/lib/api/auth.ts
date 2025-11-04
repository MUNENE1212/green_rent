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
    const response = await apiClient.post<any>('/auth/login', credentials);
    // Backend returns tokens.accessToken, but we need token
    if (response.data && response.data.tokens) {
      return {
        ...response,
        data: {
          user: response.data.user,
          token: response.data.tokens.accessToken,
        },
      };
    }
    return response;
  },

  register: async (data: RegisterData): Promise<APIResponse<{ user: User; token: string }>> => {
    // Transform data to match backend expected format
    const payload = {
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: data.role,
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    };
    const response = await apiClient.post<any>('/auth/register', payload);
    // Backend returns tokens.accessToken, but we need token
    if (response.data && response.data.tokens) {
      return {
        ...response,
        data: {
          user: response.data.user,
          token: response.data.tokens.accessToken,
        },
      };
    }
    return response;
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
