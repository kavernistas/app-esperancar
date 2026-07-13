// src/api/okrs.js — OKRs API
import api from './client';

export async function listOkrs(params = {}) { return api.get('/okrs', params); }
export async function getOkr(id) { return api.get(`/okrs/${id}`); }
export async function createOkr(data) { return api.post('/okrs', data); }
export async function updateOkr(id, data) { return api.patch(`/okrs/${id}`, data); }
export async function deleteOkr(id) { return api.delete(`/okrs/${id}`); }