// src/api/sofia.js
// Sofia IA API

import api from './client';

export async function analyze(prompt, options = {}) {
  return api.post('/sofia/analyze', { prompt, ...options });
}

export async function analyzeTseData(tseData, ano, uf, cargo, candidato) {
  return api.post('/sofia/analyze/tse', { tseData, ano, uf, cargo, candidato });
}

export async function getGamificationInsight(profile, recentActivity) {
  return api.post('/sofia/gamification/insight', { profile, recentActivity });
}

export async function recommendMissions(leaderProfile, availableContacts, recentDemands) {
  return api.post('/sofia/missions/recommend', { leaderProfile, availableContacts, recentDemands });
}

export async function getHistory(params = {}) {
  return api.get('/sofia/history', params);
}

export async function getProviders() {
  return api.get('/sofia/providers');
}

export async function clearCache() {
  return api.delete('/sofia/cache');
}
