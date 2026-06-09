import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/finance';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (current: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth on mount - check if token exists and fetch user
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await apiClient.getCurrentUser();
          if (response.user) {
            setUser(response.user as User);
          } else {
            // Token is invalid, clear it
            apiClient.clearAuth();
          }
        } catch (error) {
          console.error('Failed to fetch current user:', error);
          apiClient.clearAuth();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, confirmPassword: string) => {
    try {
      const response = await apiClient.register(name, email, password, confirmPassword);
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await apiClient.logoutAll();
      setUser(null);
    } catch (error) {
      console.error('Logout all error:', error);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const response = await apiClient.updateProfile({
        name: updates.name,
        currency: updates.currency,
        monthlyBudget: updates.monthlyBudget,
      });
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: response.error || 'Update failed' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Update failed' };
    }
  }, []);

  const changePassword = useCallback(async (current: string, newPass: string, confirmPass: string) => {
    try {
      const response = await apiClient.changePassword(current, newPass, confirmPass);
      if (response.success) {
        // Password changed, user needs to login again
        setUser(null);
        return { success: true };
      }
      return { success: false, error: response.error || 'Password change failed' };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'Password change failed' };
    }
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    try {
      const response = await apiClient.deleteAccount(password);
      if (response.success) {
        setUser(null);
        return { success: true };
      }
      return { success: false, error: response.error || 'Account deletion failed' };
    } catch (error) {
      console.error('Account deletion error:', error);
      return { success: false, error: 'Account deletion failed' };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        logoutAll,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
