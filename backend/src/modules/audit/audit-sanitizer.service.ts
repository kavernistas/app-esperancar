import { Injectable } from '@nestjs/common';

const SENSITIVE_KEYS = [
  'password', 'password_hash', 'passwordHash',
  'refresh_token', 'refreshToken', 'refresh',
  'access_token', 'accessToken', 'token', 'token_hash',
  'authorization', 'cookie', 'secret',
  'api_key', 'apiKey', 'private_key',
];

function redactValue(key: string, value: any): any {
  const k = String(key).toLowerCase().replace(/[-\s_]/g, '');
  for (const sensitive of SENSITIVE_KEYS) {
    const s = sensitive.toLowerCase().replace(/[-\s_]/g, '');
    if (k === s || k.includes(s)) return '[REDACTED]';
  }
  return value;
}

function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 5) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(i => sanitizeObject(i, depth + 1));
  const out: any = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = redactValue(key, sanitizeObject(value, depth + 1));
  }
  return out;
}

@Injectable()
export class AuditSanitizer {
  sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    return sanitizeObject(obj);
  }

  /** Extract a safe subset of fields for before/after */
  pick(obj: any, fields?: string[]): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (!fields || fields.length === 0) return this.sanitize(obj);
    const out: any = {};
    for (const f of fields) {
      if (f in obj) out[f] = obj[f];
    }
    return this.sanitize(out);
  }
}
