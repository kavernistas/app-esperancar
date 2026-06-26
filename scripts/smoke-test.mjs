#!/usr/bin/env node
const BASE_URL = process.env.BASE_URL || 'https://esperancar.f5rg2q.easypanel.host/api/v1';
const EMAIL = process.env.SMOKE_EMAIL;
const PASSWORD=*** (!EMAIL || !PASSWORD) {
  console.error('ERROR: Set SMOKE_EMAIL and SMOKE_PASSWORD.');
  process.exit(1);
}

let exitCode = 0;
let token = null;

async function request(path, options = {}) {
  const url = BASE_URL + path;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let body;
  try { body = await res.json(); } catch { body = await res.text(); }
  return { status: res.status, ok: res.ok, body };
}

function assert(name, result, expected) {
  if (expected.includes(result.status)) {
    console.log('  PASS ' + name + ' (HTTP ' + result.status + ')');
  } else {
    console.log('  FAIL ' + name + ' (HTTP ' + result.status + ')');
    const s = typeof result.body === 'object' ? JSON.stringify(result.body) : String(result.body);
    console.log('        ' + s.substring(0, 200));
    exitCode = 1;
  }
}

async function main() {
  console.log('');
  console.log('Smoke Test - Esperancar V2');
  console.log('Base URL: ' + BASE_URL);
  console.log('');

  console.log('[Health]');
  assert('GET /health', await request('/health'), [200]);

  console.log('');
  console.log('[Auth]');
  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD }
  });
  assert('POST /auth/login', login, [200, 201]);

  if (login.body && login.body.data) token = login.body.data.accessToken;
  if (!token) { console.error('FATAL: No token'); process.exit(1); }
  console.log('  Token: ' + token.substring(0, 30) + '...');

  const auth = { Authorization: '***' + token };

  console.log('');
  console.log('[Me]');
  assert('GET /auth/me', await request('/auth/me', { headers: auth }), [200]);

  console.log('');
  console.log('[Core Endpoints]');
  const endpoints = [
    ['contacts', '/contacts'],
    ['leaders', '/leaders'],
    ['demands', '/demands'],
    ['missions', '/missions'],
    ['campaigns', '/campaigns'],
    ['gamification', '/gamification'],
    ['electoral-data', '/electoral-data'],
    ['notifications', '/notifications'],
    ['users', '/users'],
    ['tse/sync-status', '/tse/sync-status'],
    ['whatsapp/status', '/whatsapp/status'],
    ['sofia/providers', '/sofia/providers'],
    ['jobs', '/jobs'],
    ['files', '/files'],
    ['audit', '/audit'],
  ];

  for (const [name, path] of endpoints) {
    const result = await request(path, { headers: auth });
    assert('GET /' + name, result, [200]);
  }

  console.log('');
  console.log('[Special]');
  assert('POST /notifications/mark-all-read',
    await request('/notifications/mark-all-read', { method: 'POST', headers: auth }),
    [200, 201]);

  console.log('');
  console.log('='.repeat(50));
  if (exitCode === 0) {
    console.log('ALL TESTS PASSED');
  } else {
    console.log('SOME TESTS FAILED');
  }
  console.log('='.repeat(50));
  process.exit(exitCode);
}

main().catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
