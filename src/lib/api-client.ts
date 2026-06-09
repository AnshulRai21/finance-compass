import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage on init
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.setAuthHeader(this.token);
    }

    // Response interceptor to handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_session_id');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthHeader(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  }

  clearAuth() {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_session_id');
  }

  // Auth endpoints
  async register(
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/auth/register', {
        name,
        email,
        password,
        confirmPassword,
      });
      if (response.data.token) {
        this.setAuthHeader(response.data.token);
        localStorage.setItem('auth_session_id', response.data.sessionId);
      }
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/auth/login', { email, password });
      if (response.data.token) {
        this.setAuthHeader(response.data.token);
        localStorage.setItem('auth_session_id', response.data.sessionId);
      }
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async logout(): Promise<ApiResponse<any>> {
    try {
      await this.client.post('/auth/logout');
      this.clearAuth();
      return { success: true };
    } catch (error) {
      this.clearAuth();
      return this.handleError(error);
    }
  }

  async logoutAll(): Promise<ApiResponse<any>> {
    try {
      await this.client.post('/auth/logout-all');
      this.clearAuth();
      return { success: true };
    } catch (error) {
      this.clearAuth();
      return this.handleError(error);
    }
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/auth/me');
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProfile(data: {
    name?: string;
    currency?: string;
    monthlyBudget?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.put('/auth/profile', data);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      this.clearAuth();
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteAccount(password: string): Promise<ApiResponse<any>> {
    try {
      await this.client.delete('/auth/account', { data: { password } });
      this.clearAuth();
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse<any> {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      return { error: error.response.data.error };
    }
    return { error: 'An unexpected error occurred' };
  }
}

export const apiClient = new ApiClient();
