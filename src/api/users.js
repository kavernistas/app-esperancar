import api from './client';

export async function listUsers(params = {}) { return api.get('/users', params); }
export async function getUser(id) { return api.get(`/users/${id}`); }
export async function createUser(data) { return api.post('/users', data); }
export async function updateUser(id, data) { return api.patch(`/users/${id}`, data); }
export async function setUserRole(id, role) { return api.patch(`/users/${id}/role`, { role }); }
export async function activateUser(id) { return api.post(`/users/${id}/activate`); }
export async function deactivateUser(id) { return api.post(`/users/${id}/deactivate`); }
export async function deleteUser(id) { return api.delete(`/users/${id}`); }
