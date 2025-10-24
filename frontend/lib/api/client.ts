const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, throw generic error
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        // Log the raw error data for debugging
        console.log('API Error Response:', JSON.stringify(data, null, 2));

        // Extract error message from various possible formats
        let errorMessage = `Request failed with status ${response.status}`;

        // Check for nested error object with details array (our backend format)
        if (data.error && typeof data.error === 'object') {
          if (data.error.details && Array.isArray(data.error.details)) {
            // Extract field-specific validation errors
            const fieldErrors = data.error.details
              .map((detail: any) => {
                const field = detail.field || detail.path || 'field';
                const message = detail.message || detail.msg || 'Invalid value';
                // Remove 'profile.' prefix for cleaner display
                const cleanField = field.replace('profile.', '');
                return `${cleanField}: ${message}`;
              })
              .join('; ');
            errorMessage = fieldErrors;
          } else if (data.error.message) {
            errorMessage = data.error.message;
          }
        } else if (data.message && typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (data.error && typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.msg && typeof data.msg === 'string') {
          errorMessage = data.msg;
        } else if (data.errors) {
          // Handle different error formats
          if (typeof data.errors === 'string') {
            errorMessage = data.errors;
          } else if (Array.isArray(data.errors)) {
            // Array of error messages or objects
            const messages = data.errors.map((e: any) => {
              if (typeof e === 'string') return e;
              if (e.message) return e.message;
              if (e.msg) return e.msg;
              if (e.path && e.msg) return `${e.path}: ${e.msg}`;
              return JSON.stringify(e);
            });
            errorMessage = messages.join(', ');
          } else if (typeof data.errors === 'object') {
            // Object with field errors - could be nested
            const fieldErrors = Object.entries(data.errors)
              .map(([field, error]: [string, any]) => {
                if (typeof error === 'string') {
                  return `${field}: ${error}`;
                } else if (error.message) {
                  return `${field}: ${error.message}`;
                } else if (error.msg) {
                  return `${field}: ${error.msg}`;
                } else if (Array.isArray(error)) {
                  return `${field}: ${error.join(', ')}`;
                } else {
                  return `${field}: ${JSON.stringify(error)}`;
                }
              })
              .join('; ');
            errorMessage = fieldErrors;
          }
        }

        // Create a custom error with status code
        const error = new Error(errorMessage) as any;
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error: any) {
      // Log detailed error for debugging
      console.error('API Error:', {
        url,
        status: error.status,
        message: error.message,
        data: error.data,
      });

      // Re-throw with enhanced message
      if (error.status === 422) {
        error.message = error.message || 'Validation failed. Please check your input.';
      } else if (error.status === 401) {
        error.message = 'You are not authorized. Please log in.';
      } else if (error.status === 403) {
        error.message = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        error.message = 'The requested resource was not found.';
      } else if (error.status >= 500) {
        error.message = 'Server error. Please try again later.';
      }

      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new APIClient(API_URL);
