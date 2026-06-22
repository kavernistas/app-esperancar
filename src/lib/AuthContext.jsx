import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '@/api/auth';
import { getAccessToken } from '@/api/client';

const AuthContext = createContext();

const API_MODE = import.meta.env.VITE_API_MODE || 'BASE44';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      if (API_MODE === 'BASE44') {
        // Legacy Base44 mode
        const { base44 } = await import('@/api/base44Client');
        const userData = await base44.auth.me();
        setUser(userData);
        setIsAuthenticated(!!userData);
      } else {
        // Backend propio mode
        const token = getAccessToken();
        if (token) {
          try {
            const userData = await authApi.getMe();
            setUser(userData);
            setIsAuthenticated(true);
          } catch (e) {
            // Token expired or invalid
            setUser(null);
            setIsAuthenticated(false);
            setAuthError({ type: 'auth_required', message: 'Sessao expirada' });
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Autenticacao necessaria' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      if (API_MODE === 'BASE44') {
        const { base44 } = await import('@/api/base44Client');
        await base44.auth.redirectToLogin(window.location.href);
      } else {
        const userData = await authApi.login(email, password);
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
      }
    } catch (error) {
      setAuthError({ type: 'login_failed', message: error.message });
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    if (API_MODE === 'BASE44') {
      import('@/api/base44Client').then(({ base44 }) => {
        base44.auth.logout(window.location.href);
      });
    } else {
      authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
    }
  };

  const updateProfile = async (data) => {
    if (API_MODE === 'BASE44') {
      const { base44 } = await import('@/api/base44Client');
      await base44.auth.updateMe(data);
      const updated = await base44.auth.me();
      setUser(updated);
      return updated;
    } else {
      // TODO: Implement profile update in backend
      return data;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      login,
      logout,
      updateProfile,
      checkAuth,
      apiMode: API_MODE,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
