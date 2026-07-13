// src/api/electoral.js
import api from './client';

export async function listElectoralData(params = {}) { return api.get('/electoral-data', params); }
export async function getElectoralData(id) { return api.get(`/electoral-data/${id}`); }
export async function createElectoralData(data) { return api.post('/electoral-data', data); }
export async function updateElectoralData(id, data) { return api.patch(`/electoral-data/${id}`, data); }
export async function deleteElectoralData(id) { return api.delete(`/electoral-data/${id}`); }

export async function exportPDF(payload) { return api.post('/electoral/export-pdf', payload); }