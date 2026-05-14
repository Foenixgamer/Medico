import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../hooks/api';
import { AuthContext, User } from '../hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializar desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem('medsecure_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAccessToken(parsed.accessToken);
        setRefreshTokenValue(parsed.refreshToken);
        setUser(parsed.user);
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const persistAuth = useCallback((data: { accessToken: string; refreshToken: string; user: User }) => {
    setAccessToken(data.accessToken);
    setRefreshTokenValue(data.refreshToken);
    setUser(data.user);
    localStorage.setItem('medsecure_auth', JSON.stringify(data));
  }, []);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setRefreshTokenValue(null);
    setUser(null);
    localStorage.removeItem('medsecure_auth');
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const data = res.data;

    if (data.mfaRequired) {
      return { mfaRequired: true, mfaToken: data.mfaToken };
    }

    persistAuth({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });

    return { mfaRequired: false };
  }, [persistAuth]);

  const setupMFA = useCallback(async () => {
    const res = await api.post('/api/auth/mfa/setup');
    return res.data;
  }, []);

  const verifyMFA = useCallback(async (token: string) => {
    const res = await api.post('/api/auth/mfa/verify', { token });
    return res.data;
  }, []);

  const verifyPendingMFA = useCallback(async (mfaToken: string, token: string) => {
    const res = await api.post('/api/auth/mfa/verify', { token }, {
      headers: { Authorization: `Bearer ${mfaToken}` },
    });
    const data = res.data;
    if (data.accessToken) {
      persistAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
    }
    return data;
  }, [persistAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout', { refreshToken: refreshTokenValue });
    } catch { /* ignore */ }
    clearAuth();
  }, [refreshTokenValue, clearAuth]);

  // Interceptor para refresh automático
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && refreshTokenValue) {
          originalRequest._retry = true;
          try {
            const res = await api.post('/api/auth/refresh', { refreshToken: refreshTokenValue });
            const data = res.data;
            setAccessToken(data.accessToken);
            setRefreshTokenValue(data.refreshToken);
            localStorage.setItem('medsecure_auth', JSON.stringify({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              user,
            }));
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(originalRequest);
          } catch {
            clearAuth();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [refreshTokenValue, user, clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        login,
        setupMFA,
        verifyMFA,
        verifyPendingMFA,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
