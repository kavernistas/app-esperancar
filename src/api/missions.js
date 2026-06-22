// src/api/missions.js
import api from './client';

export async function listMissions(params = {}) { return api.get('/missions', params); }
export async function getMission(id) { return api.get(`/missions/${id}`); }
export async function createMission(data) { return api.post('/missions', data); }
export async function updateMission(id, data) { return api.patch(`/missions/${id}`, data); }
export async function deleteMission(id) { return api.delete(`/missions/${id}`); }
