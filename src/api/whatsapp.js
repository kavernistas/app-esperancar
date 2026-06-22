// src/api/whatsapp.js
// WhatsApp API — substitui base44.functions.invoke('whatsappSend')

import api from './client';

export async function sendMessage(phone, message, options = {}) {
  return api.post('/whatsapp/send-single', { phone, message, ...options });
}

export async function sendBatch(contacts, message, options = {}) {
  return api.post('/whatsapp/send', { contacts, message, ...options });
}

export async function getLogs(params = {}) {
  return api.get('/whatsapp/logs', params);
}

export async function getStats(campaignId) {
  return api.get('/whatsapp/stats', { campaignId });
}

export async function getStatus() {
  return api.get('/whatsapp/status');
}
