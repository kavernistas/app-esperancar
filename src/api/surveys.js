// src/api/surveys.js — Surveys & Survey Responses API (Base44 SDK)
import { base44 } from "@/api/base44Client";
import { extractOpts, buildFilter, safeList } from "@/lib/base44Api";

// Surveys
export async function listSurveys(params = {}, sortArg) {
  const { sort, limit } = extractOpts(params, sortArg);
  const filter = buildFilter(params);
  return safeList(base44.entities.Survey.filter(filter, sort, limit));
}

export async function getSurvey(id) {
  return await base44.entities.Survey.get(id);
}

export async function createSurvey(data) {
  return await base44.entities.Survey.create(data);
}

export async function updateSurvey(id, data) {
  return await base44.entities.Survey.update(id, data);
}

export async function deleteSurvey(id) {
  return await base44.entities.Survey.delete(id);
}

// Survey Responses
export async function listSurveyResponses(params = {}, sortArg) {
  const { sort, limit } = extractOpts(params, sortArg);
  const filter = buildFilter(params);
  return safeList(base44.entities.SurveyResponse.filter(filter, sort, limit));
}

export async function createSurveyResponse(data) {
  return await base44.entities.SurveyResponse.create(data);
}

export async function updateSurveyResponse(id, data) {
  return await base44.entities.SurveyResponse.update(id, data);
}

export async function deleteSurveyResponse(id) {
  return await base44.entities.SurveyResponse.delete(id);
}