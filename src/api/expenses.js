// src/api/expenses.js — Expenses API (Base44 SDK)
import { base44 } from "@/api/base44Client";
import { extractOpts, buildFilter, safeList } from "@/lib/base44Api";

export async function listExpenses(params = {}, sortArg) {
  const { sort, limit } = extractOpts(params, sortArg);
  const filter = buildFilter(params);
  return safeList(base44.entities.Expense.filter(filter, sort, limit));
}

export async function getExpense(id) {
  return await base44.entities.Expense.get(id);
}

export async function createExpense(data) {
  return await base44.entities.Expense.create(data);
}

export async function updateExpense(id, data) {
  return await base44.entities.Expense.update(id, data);
}

export async function deleteExpense(id) {
  return await base44.entities.Expense.delete(id);
}