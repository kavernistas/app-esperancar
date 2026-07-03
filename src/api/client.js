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

// Normalize sort params: convert { sort: "-field" } to { sortBy: "field", sortOrder: "desc" }
// Also strips undefined/null values and filters empty search params
function normalizeSortParams(params = {}) {
  // Strip undefined, null, and empty string values
  const clean = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      // If value is an object (e.g. { created_by_leader_id: "abc" }), stringify won't help
      // Convert objects to empty string so URLSearchParams drops them, or keep primitive values
      if (typeof value !== 'object') {
        clean[key] = value;
      }
    }
  }
  const { sort, ...rest } = clean;
  if (sort && typeof sort === 'string') {
    const field = sort.startsWith('-') ? sort.substring(1) : sort;
    const order = sort.startsWith('-') ? 'desc' : 'asc';
    return { ...rest, sortBy: field, sortOrder: order };
  }
  return rest;
}

// HTTP Client
async function request(method, path, data = null, options = {}) {
  const base = `${API_BASE_URL}/api/v1${path}`;
  const normalizedParams = normalizeSortParams(options.params);
  const urlWithParams = normalizedParams ? base + '?' + new URLSearchParams(normalizedParams).toString() : base;
  const headers = { 'Content-Type': 'application/json' };

  // Always read fresh token from localStorage
  const currentToken = localStorage.getItem('access_token');
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
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
  if (response.status === 401 && !path.includes('/auth/')) {
    const currentRefresh = localStorage.getItem('refresh_token');
    if (currentRefresh) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = localStorage.getItem('access_token');
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(urlWithParams, config);
      }
    }
  }

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(responseData?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  // Backend returns { success: true, data: { data: [...], meta: {...} } }
  // Extract the inner array for convenience
  const innerData = responseData?.data;
  if (innerData && typeof innerData === 'object' && 'data' in innerData && Array.isArray(innerData.data)) {
    return innerData.data;
  }
  return innerData ?? responseData;
}

async function refreshAccessToken() {
  try {
    const currentRefreshToken = localStorage.getItem('refresh_token');
    if (!currentRefreshToken) return false;
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
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
  get: (path, params) => request('GET', path, null, { params }),
  post: (path, data) => request('POST', path, data),
  patch: (path, data) => request('PATCH', path, data),
  delete: (path) => request('DELETE', path),
};

// TSE API
export const tseApi = {
  getData: (params = {}) => request('/tse/sync-status', { method: 'GET', params }),
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
  list: async (sort = '-created_at', limit = 100) => {
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
