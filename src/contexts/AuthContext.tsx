import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/finance';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  changePassword: (current: string, newPass: string) => { success: boolean; error?: string };
  deleteAccount: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const getUsers = (): User[] => {
  try {
    return JSON.parse(localStorage.getItem('fm_users') || '[]');
  } catch { return []; }
};

const saveUsers = (users: User[]) => {
  localStorage.setItem('fm_users', JSON.stringify(users));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const sessionId = localStorage.getItem('fm_session');
      if (sessionId) {
        const users = getUsers();
        const found = users.find(u => u.id === sessionId);
        if (found) setUser(found);
        else localStorage.removeItem('fm_session');
      }
    } catch {
      localStorage.removeItem('fm_session');
    }
  }, []);

  const login = useCallback((email: string, password: string) => {
    const users = getUsers();
    const found = users.find(u => u.email === email.trim().toLowerCase());
    if (!found) return { success: false, error: 'Account not found' };
    if (found.password !== password) return { success: false, error: 'Incorrect password' };
    localStorage.setItem('fm_session', found.id);
    setUser(found);
    return { success: true };
  }, []);

  const register = useCallback((name: string, email: string, password: string) => {
    const users = getUsers();
    const trimmedEmail = email.trim().toLowerCase();
    if (users.find(u => u.email === trimmedEmail)) {
      return { success: false, error: 'An account with this email already exists' };
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: trimmedEmail,
      password,
      currency: 'USD',
      monthlyBudget: 0,
      createdAt: new Date().toISOString(),
      role: 'user',
    };
    const updated = [...users, newUser];
    saveUsers(updated);
    localStorage.setItem('fm_session', newUser.id);
    setUser(newUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fm_session');
    setUser(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    if (!user) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return;
    const updatedUser = { ...users[idx], ...updates, id: user.id, password: users[idx].password };
    users[idx] = updatedUser;
    saveUsers(users);
    setUser(updatedUser);
  }, [user]);

  const changePassword = useCallback((current: string, newPass: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return { success: false, error: 'User not found' };
    if (users[idx].password !== current) return { success: false, error: 'Current password is incorrect' };
    users[idx].password = newPass;
    saveUsers(users);
    return { success: true };
  }, [user]);

  const deleteAccount = useCallback(() => {
    if (!user) return;
    const users = getUsers().filter(u => u.id !== user.id);
    saveUsers(users);
    const txns = JSON.parse(localStorage.getItem('fm_transactions') || '[]');
    localStorage.setItem('fm_transactions', JSON.stringify(txns.filter((t: any) => t.userId !== user.id)));
    localStorage.removeItem('fm_session');
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, updateProfile, changePassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};
