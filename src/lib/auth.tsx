'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch, setToken, clearToken, getToken } from '@/lib/api';

interface SimpleUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: SimpleUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const { data } = await apiFetch<{ user: SimpleUser | null }>('/api/auth/me');
        if (data?.user) {
          setUser(data.user);
        } else {
          clearToken();
        }
      } catch {
        clearToken();
      } finally {
        setLoading(false);
      }
    };
    // Timeout fallback
    const timeout = setTimeout(() => setLoading(false), 5000);
    init().finally(() => clearTimeout(timeout));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await apiFetch<{ user: SimpleUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (error) return { error };
    if (data) {
      setToken(data.token);
      setUser(data.user);
    }
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await apiFetch<{ user: SimpleUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: { email, password },
    });
    if (error) return { error };
    if (data) {
      setToken(data.token);
      setUser(data.user);
    }
    return {};
  }, []);

  const signOut = useCallback(async () => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
