# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crm.spec.mjs >> edit contact persists
- Location: e2e/crm.spec.mjs:63:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 201
Received: 500
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BASE = 'https://esperancar.f5rg2q.easypanel.host';
  4   | const API = BASE + '/api/v1';
  5   | const EMAIL = 'dralanrobertoferreira@gmail.com';
  6   | const PASSWORD = process.env.E2E_PASSWORD || 'Admin@2026';
  7   | 
  8   | async function login(page) {
  9   |   const res = await page.request.post(API + '/auth/login', {
  10  |     data: { email: EMAIL, password: PASSWORD }
  11  |   });
  12  |   const body = await res.json();
  13  |   if (!body.data || !body.data.accessToken) {
  14  |     throw new Error('Login failed status=' + res.status() + ' body=' + JSON.stringify(body).slice(0, 200));
  15  |   }
  16  |   return body.data.accessToken;
  17  | }
  18  | 
  19  | function auth(token) {
  20  |   const h = { 'Content-Type': 'application/json' };
  21  |   h['Authorization'] = ['Bearer', token].join(' ');
  22  |   return h;
  23  | }
  24  | 
  25  | test('create contact with CEP', async ({ page }) => {
  26  |   const ts = Date.now();
  27  |   const token = await login(page);
  28  | 
  29  |   const created = await page.request.post(API + '/contacts', {
  30  |     headers: auth(token),
  31  |     data: {
  32  |       full_name: 'PW CREATE ' + ts,
  33  |       phone: '11' + (Math.floor(Math.random() * 900000000) + 100000000),
  34  |       email: 'pw-' + ts + '@test.invalid',
  35  |       cep: '01001000',
  36  |       address_street: 'Rua Augusta',
  37  |       address_number: '100',
  38  |       complement: 'Apto 32',
  39  |       neighborhood: 'Centro',
  40  |       city: 'Sao Paulo',
  41  |       state: 'SP',
  42  |       position: 'Coordenador',
  43  |       is_leader: true,
  44  |       engagement_level: 75,
  45  |       tags: ['e2e'],
  46  |       latitude: -23.5505,
  47  |       longitude: -46.6333,
  48  |     }
  49  |   });
  50  |   expect(created.status(), 'POST /contacts should be 201').toBe(201);
  51  |   const body = await created.json();
  52  |   expect(body.data.cep).toBe('01001000');
  53  |   expect(body.data.state).toBe('SP');
  54  |   expect(body.data.complement).toBe('Apto 32');
  55  |   console.log('PASS create id=' + body.data.id);
  56  | 
  57  |   const got = await page.request.get(API + '/contacts/' + body.data.id, { headers: auth(token) });
  58  |   expect(got.status()).toBe(200);
  59  |   expect((await got.json()).data.cep).toBe('01001000');
  60  |   console.log('PASS get verified');
  61  | });
  62  | 
  63  | test('edit contact persists', async ({ page }) => {
  64  |   const ts = Date.now();
  65  |   const token = await login(page);
  66  | 
  67  |   const created = await page.request.post(API + '/contacts', {
  68  |     headers: auth(token),
  69  |     data: { full_name: 'PW EDIT ' + ts, phone: '11' + (Math.floor(Math.random() * 900000000) + 100000000), email: 'ed-' + ts + '@test.invalid', cep: '01001000' }
  70  |   });
> 71  |   expect(created.status()).toBe(201);
      |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  72  |   const id = (await created.json()).data.id;
  73  | 
  74  |   const patched = await page.request.patch(API + '/contacts/' + id, {
  75  |     headers: auth(token),
  76  |     data: { full_name: 'PW EDIT MOD ' + ts, position: 'Vice-Coordenador', engagement_level: 88 }
  77  |   });
  78  |   expect(patched.status()).toBe(200);
  79  |   const patchBody = await patched.json();
  80  |   expect(patchBody.data.full_name).toBe('PW EDIT MOD ' + ts);
  81  |   console.log('PASS edit');
  82  | 
  83  |   const got = await page.request.get(API + '/contacts/' + id, { headers: auth(token) });
  84  |   expect((await got.json()).data.engagement_level).toBe(88);
  85  |   console.log('PASS edit persists');
  86  | });
  87  | 
  88  | test('create demand with cep and lowercase type', async ({ page }) => {
  89  |   const ts = Date.now();
  90  |   const token = await login(page);
  91  | 
  92  |   const created = await page.request.post(API + '/demands', {
  93  |     headers: auth(token),
  94  |     data: {
  95  |       title: 'PW DEMAND ' + ts,
  96  |       type: 'other',
  97  |       description: 'E2E test demand',
  98  |       cep: '01001000',
  99  |       city: 'Sao Paulo',
  100 |       neighborhood: 'Centro',
  101 |     }
  102 |   });
  103 |   expect(created.status()).toBe(201);
  104 |   const body = await created.json();
  105 |   expect(body.data.cep).toBe('01001000');
  106 |   expect(body.data.type).toBe('OTHER');
  107 |   console.log('PASS demand type=' + body.data.type);
  108 | });
  109 | 
  110 | test('missions endpoints respond without loop', async ({ page }) => {
  111 |   const token = await login(page);
  112 | 
  113 |   const r1 = await page.request.get(API + '/missions?limit=10', { headers: auth(token) });
  114 |   const r2 = await page.request.get(API + '/missions?limit=10', { headers: auth(token) });
  115 |   const r3 = await page.request.get(API + '/missions?limit=10', { headers: auth(token) });
  116 |   expect([r1.status(), r2.status(), r3.status()]).toEqual([200, 200, 200]);
  117 |   console.log('PASS missions x3 all 200');
  118 | 
  119 |   const created = await page.request.post(API + '/missions', {
  120 |     headers: auth(token),
  121 |     data: { title: 'PW MISSION ' + Date.now(), type: 'REGISTER_SUPPORTERS', points: 50, priority: 'MEDIUM' }
  122 |   });
  123 |   expect(created.status()).toBe(201);
  124 |   const mid = (await created.json()).data.id;
  125 | 
  126 |   const got = await page.request.get(API + '/missions/' + mid, { headers: auth(token) });
  127 |   expect(got.status()).toBe(200);
  128 | 
  129 |   const patched = await page.request.patch(API + '/missions/' + mid, {
  130 |     headers: auth(token),
  131 |     data: { status: 'IN_PROGRESS' }
  132 |   });
  133 |   expect(patched.status()).toBe(200);
  134 |   console.log('PASS mission lifecycle');
  135 | });
  136 | 
```