// src/api/campaigns.js — Campaigns API (Base44 SDK)
import { base44 } from "@/api/base44Client";
import { extractOpts, buildFilter, safeList } from "@/lib/base44Api";

export async function listCampaigns(params = {}, sortArg) {
  const { sort, limit } = extractOpts(params, sortArg);
  const filter = buildFilter(params);
  return safeList(base44.entities.Campaign.filter(filter, sort, limit));
}

export async function getCampaign(id) {
  return await base44.entities.Campaign.get(id);
}

export async function createCampaign(data) {
  return await base44.entities.Campaign.create(data);
}

export async function updateCampaign(id, data) {
  return await base44.entities.Campaign.update(id, data);
}

export async function deleteCampaign(id) {
  return await base44.entities.Campaign.delete(id);
}