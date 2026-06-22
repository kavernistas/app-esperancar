// src/api/demands.js
import api from './client';

export async function listDemands(params = {}) { return api.get('/demands', params); }
export async function getDemand(id) { return api.get(`/demands/${id}`); }
export async function createDemand(data) { return api.post('/demands', data); }
export async function updateDemand(id, data) { return api.patch(`/demands/${id}`, data); }
export async function deleteDemand(id) { return api.delete(`/demands/${id}`); }
