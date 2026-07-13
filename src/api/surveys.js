// src/api/surveys.js — Surveys & Survey Responses API
import api from './client';

// Surveys
export async function listSurveys(params = {}) { return api.get('/surveys', params); }
export async function getSurvey(id) { return api.get(`/surveys/${id}`); }
export async function createSurvey(data) { return api.post('/surveys', data); }
export async function updateSurvey(id, data) { return api.patch(`/surveys/${id}`, data); }
export async function deleteSurvey(id) { return api.delete(`/surveys/${id}`); }

// Survey Responses
export async function listSurveyResponses(params = {}) { return api.get('/survey-responses', params); }
export async function createSurveyResponse(data) { return api.post('/survey-responses', data); }
export async function updateSurveyResponse(id, data) { return api.patch(`/survey-responses/${id}`, data); }
export async function deleteSurveyResponse(id) { return api.delete(`/survey-responses/${id}`); }