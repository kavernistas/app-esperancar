// src/lib/cep.js — ViaCEP auto-fill helper with cancel-able fetch

const VIACEP_BASE = 'https://viacep.com.br/ws';

let activeController = null;

export function normalizeCep(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 8);
}

export function formatCep(value) {
  const digits = normalizeCep(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isCepComplete(value) {
  return normalizeCep(value).length === 8;
}

/**
 * Consulta o ViaCEP de forma cancelável.
 * Retorna null se o CEP não for encontrado.
 * Rejeita em erro de rede/timeout.
 */
export async function fetchCep(rawCep, { timeoutMs = 8000 } = {}) {
  const cep = normalizeCep(rawCep);
  if (cep.length !== 8) {
    throw new Error('CEP incompleto — são necessários 8 dígitos.');
  }

  // Cancel any previous in-flight request
  if (activeController) activeController.abort();
  activeController = new AbortController();
  const { signal } = activeController;

  const timeoutId = setTimeout(() => activeController?.abort(), timeoutMs);

  try {
    const res = await fetch(`${VIACEP_BASE}/${cep}/json/`, { signal });
    if (!res.ok) throw new Error(`ViaCEP HTTP ${res.status}`);
    const data = await res.json();
    if (!data || data.erro) return null;
    return {
      cep: data.cep || cep,
      street: data.logradouro || '',
      complement: data.complemento || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      ibge: data.ibge || '',
     gia: data.gia || '',
    };
  } finally {
    clearTimeout(timeoutId);
    if (activeController?.signal === signal) activeController = null;
  }
}

export function cancelPendingCep() {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
}
