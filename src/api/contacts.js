// src/api/contacts.js — Contacts API (Base44 SDK)
import { base44 } from "@/api/base44Client";
import { extractOpts, buildFilter, safeList } from "@/lib/base44Api";

export async function listContacts(params = {}, sortArg) {
  const { sort, limit } = extractOpts(params, sortArg);
  const filter = buildFilter(params);
  return safeList(base44.entities.Contact.filter(filter, sort, limit));
}

export async function getContact(id) {
  return await base44.entities.Contact.get(id);
}

export async function createContact(data) {
  return await base44.entities.Contact.create(data);
}

export async function updateContact(id, data) {
  return await base44.entities.Contact.update(id, data);
}

export async function deleteContact(id) {
  return await base44.entities.Contact.delete(id);
}