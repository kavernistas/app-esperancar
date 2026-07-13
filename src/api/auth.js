// src/api/auth.js
// Auth API — migrated to Base44 platform auth

import { base44 } from '@/api/base44Client';
import { clearTokens, getAccessToken } from './client';

export async function login(email, password) {
  // Base44 platform handles login via its own login page
  base44.auth.redirectToLogin(window.location.pathname);
}

export async function refreshToken(refreshTokenValue) {
  // Not needed — Base44 SDK manages token refresh internally
  return null;
}

export async function logout() {
  try {
    await base44.auth.logout();
  } finally {
    clearTokens();
  }
}

export async function updateProfile(data) {
  return await base44.auth.updateMe(data);
}

export async function getMe() {
  return await base44.auth.me();
}

export function isAuthenticated() {
  return !!getAccessToken();
}