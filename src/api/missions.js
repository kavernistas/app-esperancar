// src/api/missions.js — Missions API (Base44 SDK)
import { base44 } from "@/api/base44Client";
import { extractOpts, buildFilter, safeList } from "@/lib/base44Api";

export async function listMissions(params = {}, sortArg) {
  const { sort, limit } = extractOpts(params, sortArg);
  const filter = buildFilter(params);
  return safeList(base44.entities.Mission.filter(filter, sort, limit));
}

export async function getMission(id) {
  return await base44.entities.Mission.get(id);
}

export async function createMission(data) {
  return await base44.entities.Mission.create(data);
}

export async function updateMission(id, data) {
  return await base44.entities.Mission.update(id, data);
}

export async function deleteMission(id) {
  return await base44.entities.Mission.delete(id);
}

/** Criar múltiplas missões em lote */
export async function bulkCreate(missions) {
  return await base44.entities.Mission.bulkCreate(missions);
}