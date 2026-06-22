// src/api/leaders.js
import api from './client';

export async function listLeaders(params = {}) { return api.get('/leaders', params); }
export async function getLeader(id) { return api.get(`/leaders/${id}`); }
export async function createLeader(data) { return api.post('/leaders', data); }
export async function updateLeader(id, data) { return api.patch(`/leaders/${id}`, data); }
export async function deleteLeader(id) { return api.delete(`/leaders/${id}`); }
