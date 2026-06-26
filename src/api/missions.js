// src/api/missions.js
import api from './client';

export async function listMissions(params = {}) { return api.get('/missions', params); }
export async function getMission(id) { return api.get(`/missions/${id}`); }
export async function createMission(data) { return api.post('/missions', data); }
export async function updateMission(id, data) { return api.patch(`/missions/${id}`, data); }
export async function deleteMission(id) { return api.delete(`/missions/${id}`); }

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
