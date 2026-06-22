// src/api/campaigns.js
import api from './client';

export async function listCampaigns(params = {}) { return api.get('/campaigns', params); }
export async function getCampaign(id) { return api.get(`/campaigns/${id}`); }
export async function createCampaign(data) { return api.post('/campaigns', data); }
export async function updateCampaign(id, data) { return api.patch(`/campaigns/${id}`, data); }
export async function deleteCampaign(id) { return api.delete(`/campaigns/${id}`); }
