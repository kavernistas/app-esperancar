FUNCTIONAL HEALTH AUDIT — ESPERANÇAR
======================================
Data: 2026-06-23

NOTA: Testes funcionais não puderam ser realizados externamente porque
o backend não é acessível via Traefik. Os testes abaixo são baseados
em análise do código e status dos serviços.

LOGIN (auth.service.ts):
  ✅ Lógica correta: bcrypt.compare + JWT + refresh token
  ✅ Validação de status ACTIVE
  ❌ Não testado externamente (proxy fora)

LOGOUT:
  ✅ Limpa tokens do localStorage
  ✅ Chama /auth/logout no backend

REFRESH TOKEN:
  ✅ Automático em 401 (client.js)
  ✅ Endpoint /api/v1/auth/refresh

CONTACTS:
  ✅ CRUD completo (GET, POST, PATCH, DELETE)
  ✅ Módulo ContactsModule carregado

LEADERS:
  ✅ CRUD completo
  ✅ Módulo LeadersModule carregado

DEMANDS:
  ✅ CRUD completo
  ✅ Cron job: check_overdue_demands (cada 1h)
  ✅ Módulo DemandsModule carregado

MISSIONS:
  ✅ CRUD completo
  ✅ Cron job: mark_overdue_missions (cada 30min)
  ✅ Módulo MissionsModule carregado

CAMPAIGNS:
  ✅ CRUD completo
  ✅ Módulo CampaignModule carregado

NOTIFICATIONS:
  ✅ CRUD completo
  ✅ Módulo NotificationModule carregado

GAMIFICATION:
  ✅ CRUD completo
  ✅ Módulo GamificationModule carregado

TSE:
  ✅ Módulo TseModule carregado
  ✅ Endpoints: sync-status, votes, candidates, import-jobs, etc.

SOFIA IA:
  ✅ Módulo SofiaModule carregado
  ✅ Endpoints: analyze, history, providers, cache

WHATSAPP:
  ✅ Módulo WhatsAppModule carregado
  ✅ Endpoints: send, send-single, logs, stats, status

UPLOAD:
  ✅ Módulo FilesModule carregado
  ✅ Endpoints: upload, download, provider/info

BLOQUEIO: Nenhum endpoint foi testado externamente.
STATUS: ⚠️ CÓDIGO OK — IMPOSSÍVEL VALIDAR SEM PROXY FUNCIONAL
