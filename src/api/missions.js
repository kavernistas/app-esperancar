// src/api/missions.js — Missions API with normalized response unwrapping

import api from './client';

// Extract paginated { data: [...], meta: {...} } response without mutating value
function unwrapPaginated(response) {
  // response may be already unwrapped by api client from raw { data: { data, meta } }
  if (response && typeof response === 'object') {
    if (Array.isArray(response.data) && response.meta) {
      // Already structured { data: [...], meta: {...} }
      return { data: response.data, meta: response.meta };
    }
    if (Array.isArray(response)) {
      // Client unwrapped the array out of { data } — return as-is, meta unknown
      return { data: response, meta: null };
    }
  }
  return { data: Array.isArray(response) ? response : [], meta: null };
}

// Extract single entity { data: {...} }
function unwrapEntity(response) {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    if ('data' in response && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
  }
  return response;
}

export async function listMissions(params = {}) {
  const raw = await api.get('/missions', params);
  return unwrapPaginated(raw);
}

export async function getMission(id) {
  const raw = await api.get(`/missions/${id}`);
  return unwrapEntity(raw);
}

export async function createMission(data) {
  const raw = await api.post('/missions', data);
  return unwrapEntity(raw);
}

export async function updateMission(id, data) {
  const raw = await api.patch(`/missions/${id}`, data);
  return unwrapEntity(raw);
}

export async function deleteMission(id) {
  return api.delete(`/missions/${id}`);
}

/**
 * Criar múltiplas missões em lote (sub-missões de missão em grupo)
 */
export async function bulkCreate(missions) {
  const results = [];
  for (const m of missions) {
    try {
      const created = await createMission(m);
      results.push({ success: true, data: created });
    } catch (e) {
      results.push({ success: false, error: e.message, data: m });
    }
  }
  const failures = results.filter(r => !r.success);
  if (failures.length === missions.length) {
    throw new Error(`Falha ao criar ${failures.length} missões`);
  }
  return { data: results, created: results.filter(r => r.success).length, failed: failures.length };
}
