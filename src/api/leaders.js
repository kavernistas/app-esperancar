// src/api/leaders.js — Leaders API (Base44 SDK)
import { base44 } from "@/api/base44Client";
import { extractOpts, buildFilter, safeList } from "@/lib/base44Api";

export async function listLeaders(params = {}, sortArg) {
  const { sort, limit } = extractOpts(params, sortArg);
  const filter = buildFilter(params);
  return safeList(base44.entities.Leader.filter(filter, sort, limit));
}

export async function getLeader(id) {
  return await base44.entities.Leader.get(id);
}

export async function createLeader(data) {
  return await base44.entities.Leader.create(data);
}

export async function updateLeader(id, data) {
  return await base44.entities.Leader.update(id, data);
}

export async function deleteLeader(id) {
  return await base44.entities.Leader.delete(id);
}