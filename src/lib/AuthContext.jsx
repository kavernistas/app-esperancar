import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '@/api/auth';
import { getAccessToken } from '@/api/client';

const AuthContext = createContext();

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

      const token = getAccessToken();
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (e) {
          setUser(null);
          setIsAuthenticated(false);
          setAuthError({ type: 'auth_required', message: 'Sessao expirada' });
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
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
      const userData = await authApi.login(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      setAuthError({ type: 'login_failed', message: error.message });
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const updateProfile = async (data) => {
    const updated = await authApi.updateProfile(data);
    setUser(updated);
    return updated;
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
