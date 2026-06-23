BACKEND HEALTH AUDIT — ESPERANÇAR
====================================
Data: 2026-06-23

SERVIÇO: esperancar-backend
  Status:        Running (1/1)
  Uptime:        11+ hours
  Imagem:        127.0.0.1:5000/esperancar-backend:latest
  Porta:         3001/tcp
  Healthcheck:   healthy

MÓDULOS INICIALIZADOS (todos OK):
  ✅ PrismaModule
  ✅ PassportModule
  ✅ ThrottlerModule
  ✅ ConfigHostModule
  ✅ TerminusModule
  ✅ JwtModule
  ✅ AuditModule
  ✅ UsersModule
  ✅ CampaignModule
  ✅ GamificationModule
  ✅ ElectoralModule
  ✅ NotificationModule
  ✅ ContactsModule
  ✅ LeadersModule
  ✅ DemandsModule
  ✅ MissionsModule
  ✅ TseModule
  ✅ WhatsAppModule
  ✅ SofiaModule
  ✅ FilesModule
  ✅ JobsModule
  ✅ AuthModule

ROTAS MAPEADAS:
  Health:    /api/health, /api/health/ready, /api/health/live
  Auth:      /api/auth/login, /api/auth/refresh, /api/auth/logout, /api/auth/me
  Users:     /api/users (CRUD)
  Contacts:  /api/contacts (CRUD)
  Leaders:   /api/leaders (CRUD)
  Demands:   /api/demands (CRUD)
  Missions:  /api/missions (CRUD)
  Campaigns: /api/campaigns (CRUD)
  Gamification: /api/gamification (CRUD)
  Electoral: /api/electoral-data (CRUD)
  TSE:       /api/tse/sync-status, /api/tse/votes, /api/tse/candidates, etc.
  Audit:     /api/audit-logs (CRUD)
  Notifications: /api/notifications (CRUD)
  WhatsApp:  /api/whatsapp/send, /api/whatsapp/status, etc.
  Sofia:     /api/sofia/analyze, /api/sofia/history, etc.
  Files:     /api/files/upload, /api/files/:id, etc.
  Jobs:      /api/jobs (CRUD)

CRON JOBS ATIVOS:
  ✅ weekly_maintenance (0 3 * * 0)
  ✅ check_overdue_demands (0 * * * *)
  ✅ mark_overdue_missions (30 * * * *)

LOGS (últimas 200 linhas):
  - Sem erros
  - Jobs cron executando normalmente
  - API running on port 3001
  - Swagger docs: http://localhost:3001/docs

SWAGGER: Disponível em /docs (interno)

STATUS: ✅ BACKEND SAUDÁVEL (internamente)
PROBLEMA: Não acessível externamente (ver ROUTE_PROXY_AUDIT)
