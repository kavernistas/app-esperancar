// src/api/notifications.js
import api from './client';

export async function listNotifications(params = {}) { return api.get('/notifications', params); }
export async function markAsRead(id) { return api.patch(`/notifications/${id}`, { read: true }); }
export async function markAllRead() { return api.post('/notifications/mark-all-read', {}); }
