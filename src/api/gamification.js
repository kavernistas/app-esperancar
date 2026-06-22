// src/api/gamification.js
import api from './client';

export async function listProfiles(params = {}) { return api.get('/gamification', params); }
export async function getProfile(id) { return api.get(`/gamification/${id}`); }
export async function updateProfile(id, data) { return api.patch(`/gamification/${id}`, data); }
