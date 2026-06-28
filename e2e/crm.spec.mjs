import { test, expect } from '@playwright/test';

const BASE = 'https://esperancar.f5rg2q.easypanel.host';
const API = BASE + '/api/v1';
const EMAIL = 'dralanrobertoferreira@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD || 'Admin@2026';

async function login(page) {
  const res = await page.request.post(API + '/auth/login', {
    data: { email: EMAIL, password: PASSWORD }
  });
  const body = await res.json();
  if (!body.data || !body.data.accessToken) {
    throw new Error('Login failed status=' + res.status() + ' body=' + JSON.stringify(body).slice(0, 200));
  }
  return body.data.accessToken;
}

function auth(token) {
  const h = { 'Content-Type': 'application/json' };
  h['Authorization'] = ['Bearer', token].join(' ');
  return h;
}

test('create contact with CEP', async ({ page }) => {
  const ts = Date.now();
  const token = await login(page);

  const created = await page.request.post(API + '/contacts', {
    headers: auth(token),
    data: {
      full_name: 'PW CREATE ' + ts,
      phone: '11' + (Math.floor(Math.random() * 900000000) + 100000000),
      email: 'pw-' + ts + '@test.invalid',
      cep: '01001000',
      address_street: 'Rua Augusta',
      address_number: '100',
      complement: 'Apto 32',
      neighborhood: 'Centro',
      city: 'Sao Paulo',
      state: 'SP',
      position: 'Coordenador',
      is_leader: true,
      engagement_level: 75,
      tags: ['e2e'],
      latitude: -23.5505,
      longitude: -46.6333,
    }
  });
  expect(created.status(), 'POST /contacts should be 201').toBe(201);
  const body = await created.json();
  expect(body.data.cep).toBe('01001000');
  expect(body.data.state).toBe('SP');
  expect(body.data.complement).toBe('Apto 32');
  console.log('PASS create id=' + body.data.id);

  const got = await page.request.get(API + '/contacts/' + body.data.id, { headers: auth(token) });
  expect(got.status()).toBe(200);
  expect((await got.json()).data.cep).toBe('01001000');
  console.log('PASS get verified');
});

test('edit contact persists', async ({ page }) => {
  const ts = Date.now();
  const token = await login(page);

  const created = await page.request.post(API + '/contacts', {
    headers: auth(token),
    data: { full_name: 'PW EDIT ' + ts, phone: '11' + (Math.floor(Math.random() * 900000000) + 100000000), email: 'ed-' + ts + '@test.invalid', cep: '01001000' }
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).data.id;

  const patched = await page.request.patch(API + '/contacts/' + id, {
    headers: auth(token),
    data: { full_name: 'PW EDIT MOD ' + ts, position: 'Vice-Coordenador', engagement_level: 88 }
  });
  expect(patched.status()).toBe(200);
  const patchBody = await patched.json();
  expect(patchBody.data.full_name).toBe('PW EDIT MOD ' + ts);
  console.log('PASS edit');

  const got = await page.request.get(API + '/contacts/' + id, { headers: auth(token) });
  expect((await got.json()).data.engagement_level).toBe(88);
  console.log('PASS edit persists');
});

test('create demand with cep and lowercase type', async ({ page }) => {
  const ts = Date.now();
  const token = await login(page);

  const created = await page.request.post(API + '/demands', {
    headers: auth(token),
    data: {
      title: 'PW DEMAND ' + ts,
      type: 'other',
      description: 'E2E test demand',
      cep: '01001000',
      city: 'Sao Paulo',
      neighborhood: 'Centro',
    }
  });
  expect(created.status()).toBe(201);
  const body = await created.json();
  expect(body.data.cep).toBe('01001000');
  expect(body.data.type).toBe('OTHER');
  console.log('PASS demand type=' + body.data.type);
});

test('missions endpoints respond without loop', async ({ page }) => {
  const token = await login(page);

  const r1 = await page.request.get(API + '/missions?limit=10', { headers: auth(token) });
  const r2 = await page.request.get(API + '/missions?limit=10', { headers: auth(token) });
  const r3 = await page.request.get(API + '/missions?limit=10', { headers: auth(token) });
  expect([r1.status(), r2.status(), r3.status()]).toEqual([200, 200, 200]);
  console.log('PASS missions x3 all 200');

  const created = await page.request.post(API + '/missions', {
    headers: auth(token),
    data: { title: 'PW MISSION ' + Date.now(), type: 'REGISTER_SUPPORTERS', points: 50, priority: 'MEDIUM' }
  });
  expect(created.status()).toBe(201);
  const mid = (await created.json()).data.id;

  const got = await page.request.get(API + '/missions/' + mid, { headers: auth(token) });
  expect(got.status()).toBe(200);

  const patched = await page.request.patch(API + '/missions/' + mid, {
    headers: auth(token),
    data: { status: 'IN_PROGRESS' }
  });
  expect(patched.status()).toBe(200);
  console.log('PASS mission lifecycle');
});
