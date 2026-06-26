/**
 * Normaliza status do Prisma (maiúsculas) para comparação segura.
 * Use sempre ao comparar status vindos do backend.
 */
export function normalizeStatus(status) {
  return String(status || "").trim().toUpperCase();
}

/**
 * Verifica se o status corresponde a um dos valores esperados.
 */
export function isStatus(status, ...expected) {
  const s = normalizeStatus(status);
  return expected.map(e => normalizeStatus(e)).includes(s);
}
