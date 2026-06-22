// src/api/client.js
// API Client com suporte a BASE44 e BACKEND_PROPRIO via VITE_API_MODE

const API_MODE = import.meta.env.VITE_API_MODE || 'BASE44';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Token management
let accessToken = localStorage.getItem('access_token') || null;
let refreshToken = localStorage.getItem('refresh_token') || null;

export function setTokens({ accessToken: at, refreshToken: rt }) {
  accessToken = at;
  refreshToken = rt;
  if (at) localStorage.setItem('access_token', at);
  if (rt) localStorage.setItem('refresh_token', rt);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getAccessToken() {
  return accessToken;
}

// HTTP Client
async function request(method, path, data = null, options = {}) {
  if (API_MODE === 'BASE44') {
    throw new Error('BASE44 mode not supported in this client. Set VITE_API_MODE=BACKEND');
  }

  const url = `${API_BASE_URL}/api/v1${path}`;
  const headers = { 'Content-Type': 'application/json' };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    method,
    headers,
    ...options,
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  let response = await fetch(url, config);

  // Try to refresh token on 401
  if (response.status === 401 && refreshToken && !path.includes('/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, config);
    }
  }

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(responseData?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  return responseData?.data ?? responseData;
}

async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    setTokens({
      accessToken: data.data?.accessToken || data.accessToken,
      refreshToken: data.data?.refreshToken || data.refreshToken,
    });
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// Generic HTTP methods
export const api = {
  get: (path, params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('GET', path + queryString);
  },
  post: (path, data) => request('POST', path, data),
  patch: (path, data) => request('PATCH', path, data),
  delete: (path) => request('DELETE', path),
};

export default api;
