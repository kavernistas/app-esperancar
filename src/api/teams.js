import api from './client';

export async function listTeams(params = {}) { return api.get('/teams', params); }
export async function getTeam(id) { return api.get(`/teams/${id}`); }
export async function createTeam(data) { return api.post('/teams', data); }
export async function updateTeam(id, data) { return api.patch(`/teams/${id}`, data); }
export async function deleteTeam(id) { return api.delete(`/teams/${id}`); }
export async function getTeamMembers(id) { return api.get(`/teams/${id}/members`); }
export async function addTeamMember(id, userId) { return api.post(`/teams/${id}/members`, { userId }); }
export async function removeTeamMember(id, userId) { return api.delete(`/teams/${id}/members/${userId}`); }
