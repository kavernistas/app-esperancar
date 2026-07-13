// src/api/expenses.js — Expenses API
import api from './client';

export async function listExpenses(params = {}) { return api.get('/expenses', params); }
export async function getExpense(id) { return api.get(`/expenses/${id}`); }
export async function createExpense(data) { return api.post('/expenses', data); }
export async function updateExpense(id, data) { return api.patch(`/expenses/${id}`, data); }
export async function deleteExpense(id) { return api.delete(`/expenses/${id}`); }