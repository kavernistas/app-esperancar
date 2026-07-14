// src/api/demands.js — Demands API (Base44 SDK)
import { base44 } from "@/api/base44Client";
import { extractOpts, buildFilter, safeList } from "@/lib/base44Api";

export async function listDemands(params = {}, sortArg) {
  const { sort, limit } = extractOpts(params, sortArg);
  const filter = buildFilter(params);
  return safeList(base44.entities.Demand.filter(filter, sort, limit));
}

export async function getDemand(id) {
  return await base44.entities.Demand.get(id);
}

export async function createDemand(data) {
  return await base44.entities.Demand.create(data);
}

export async function updateDemand(id, data) {
  return await base44.entities.Demand.update(id, data);
}

export async function deleteDemand(id) {
  return await base44.entities.Demand.delete(id);
}