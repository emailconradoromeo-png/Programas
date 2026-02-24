'use client';

import { createContext, useCallback, useEffect, useState, ReactNode } from 'react';
import React from 'react';
import api from '@/lib/api';
import type { User, LoginCredentials, RegisterData } from '@/types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!user;

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get<User>('/auth/me/');
      setUser(data);
    } catch {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<{ access: string; refresh: string }>('/auth/login/', {
      username,
      password,
    } as LoginCredentials);

    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    await fetchUser();
  }, [fetchUser]);

  const register = useCallback(async (data: RegisterData) => {
    await api.post('/auth/register/', data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/es/auth/login';
    }
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isAuthenticated, isLoading, login, register, logout } },
    children
  );
}
