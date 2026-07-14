// src/api/okrs.js — OKRs API (Base44 SDK)
import { base44 } from "@/api/base44Client";
import { extractOpts, buildFilter, safeList } from "@/lib/base44Api";

export async function listOkrs(params = {}, sortArg) {
  const { sort, limit } = extractOpts(params, sortArg);
  const filter = buildFilter(params);
  return safeList(base44.entities.OKR.filter(filter, sort, limit));
}

export async function getOkr(id) {
  return await base44.entities.OKR.get(id);
}

export async function createOkr(data) {
  return await base44.entities.OKR.create(data);
}

export async function updateOkr(id, data) {
  return await base44.entities.OKR.update(id, data);
}

export async function deleteOkr(id) {
  return await base44.entities.OKR.delete(id);
}