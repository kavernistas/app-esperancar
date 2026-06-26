// src/api/client.js
// API Client

const API_MODE = import.meta.env.VITE_API_MODE || 'BACKEND';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
  const base = `${API_BASE_URL}/api/v1${path}`;
  const urlWithParams = options.params ? base + '?' + new URLSearchParams(options.params).toString() : base;
  const headers = { 'Content-Type': 'application/json' };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    method,
    headers,
    ...options,
  };
  delete config.params; // Don't pass params to fetch config

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  let response = await fetch(urlWithParams, config);

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

// TSE API
export const tseApi = {
  getData: (params = {}) => request('/v1/tse/query', { method: 'GET', params }),
  getSyncStatus: (limit = 50, uf = '') => request('/v1/tse/sync-status', { method: 'GET', params: { limit, uf } }),
  listSyncStatus: () => request('/v1/tse/sync-status/list'),
  queryVotes: (params = {}) => request('/v1/tse/votes', { method: 'GET', params }),
  getCandidates: (params = {}) => request('/v1/tse/candidates', { method: 'GET', params }),
  getPollingPlaces: (params = {}) => request('/v1/tse/polling-places', { method: 'GET', params }),
  getElectorateProfiles: (params = {}) => request('/v1/tse/electorate-profiles', { method: 'GET', params }),
  import: (data) => request('/v1/tse/import', { method: 'POST', data }),
};

// Strategic Actions API (modulo backend ainda nao implementado — retorna stub)
export const strategicActionsApi = {
  list: async (sort = '-created_date', limit = 100) => {
    try { return await request('/v1/strategic-actions', { method: 'GET', params: { sort, limit } }); }
    catch (e) { console.warn('[strategicActionsApi] Backend nao implementado, retornando vazio.'); return { data: [] }; }
  },
  get: async (id) => {
    try { return await request(`/v1/strategic-actions/${id}`); }
    catch (e) { return { data: null }; }
  },
  create: async (data) => {
    try { return await request('/v1/strategic-actions', { method: 'POST', data }); }
    catch (e) { console.warn('[strategicActionsApi] create nao implementado.'); return { data: null, error: 'Nao implementado' }; }
  },
  update: async (id, data) => {
    try { return await request(`/v1/strategic-actions/${id}`, { method: 'PATCH', data }); }
    catch (e) { console.warn('[strategicActionsApi] update nao implementado.'); return { data: null, error: 'Nao implementado' }; }
  },
  delete: async (id) => {
    try { return await request(`/v1/strategic-actions/${id}`, { method: 'DELETE' }); }
    catch (e) { console.warn('[strategicActionsApi] delete nao implementado.'); return { data: null, error: 'Nao implementado' }; }
  },
};

export default api;
