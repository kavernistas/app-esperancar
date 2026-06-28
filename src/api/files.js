// src/api/files.js
// Files API

import api from './client';

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/v1/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data?.data || data;
}

export async function listFiles(params = {}) {
  return api.get('/files', params);
}

export async function getFile(id) {
  return api.get(`/files/${id}`);
}

export async function deleteFile(id) {
  return api.delete(`/files/${id}`);
}

export function getDownloadUrl(id) {
  return `/api/v1/files/${id}/download`;
}
