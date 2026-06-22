// src/api/tse.js
// TSE API — substitui base44.functions.invoke para funcoes TSE

import api from './client';

export async function getSyncStatus(ano, uf) {
  return api.get('/tse/sync-status', { ano, uf });
}

export async function queryVotes(params) {
  return api.get('/tse/votes', params);
}

export async function listCandidates(params = {}) {
  return api.get('/tse/candidates', params);
}

export async function listDataSources(params = {}) {
  return api.get('/tse/data-sources', params);
}

export async function resolveSource(ano, uf, datasetTipo) {
  return api.post('/tse/resolve-source', { ano, uf, dataset_tipo: datasetTipo });
}

export async function createImportJob(data) {
  return api.post('/tse/import-jobs', data);
}

export async function listImportJobs(params = {}) {
  return api.get('/tse/import-jobs', params);
}

export async function getImportJob(id) {
  return api.get(`/tse/import-jobs/${id}`);
}

export async function updateImportJob(id, data) {
  return api.patch(`/tse/import-jobs/${id}`, data);
}
