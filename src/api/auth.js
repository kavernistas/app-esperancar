// src/api/auth.js
// Auth API

import api, { setTokens, clearTokens, getAccessToken } from './client';

export async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  setTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
  return response.user;
}

export async function refreshToken(refreshTokenValue) {
  const response = await api.post('/auth/refresh', { refreshToken: refreshTokenValue });
  setTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
  return response;
}

export async function logout() {
  try {
    await api.post('/auth/logout', {});
  } finally {
    clearTokens();
  }
}

export async function getMe() {
  return api.get('/auth/me');
}

export function isAuthenticated() {
  return !!getAccessToken();
}
