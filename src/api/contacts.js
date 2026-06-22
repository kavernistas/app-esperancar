// src/api/contacts.js
// Contacts API

import api from './client';

export async function listContacts(params = {}) {
  return api.get('/contacts', params);
}

export async function getContact(id) {
  return api.get(`/contacts/${id}`);
}

export async function createContact(data) {
  return api.post('/contacts', data);
}

export async function updateContact(id, data) {
  return api.patch(`/contacts/${id}`, data);
}

export async function deleteContact(id) {
  return api.delete(`/contacts/${id}`);
}
