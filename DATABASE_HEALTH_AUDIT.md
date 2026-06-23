DATABASE HEALTH AUDIT — ESPERANÇAR
====================================
Data: 2026-06-23

POSTGRESQL:
  Container:  esperancar-postgres.1.lg0ppgfcfy9ltamjwb7fuyosj
  Status:     Up 14 hours (healthy)
  Porta:      5432/tcp
  User:       esperancar
  DB:         esperancar_db

TABELAS (23 total):
  ✅ _prisma_migrations
  ✅ audit_logs
  ✅ campaigns
  ✅ contacts
  ✅ demands
  ✅ electoral_data
  ✅ files
  ✅ gamification_profiles
  ✅ leaders
  ✅ missions
  ✅ notifications
  ✅ refresh_tokens
  ✅ strategic_actions
  ✅ system_configs
  ✅ tse_candidates
  ✅ tse_data_source_maps
  ✅ tse_electorate_profiles
  ✅ tse_import_jobs
  ✅ tse_polling_places
  ✅ tse_sync_status
  ✅ tse_vote_results
  ✅ users
  ✅ whatsapp_logs

USUÁRIOS:
  admin@esperancar.app | ADMIN | ACTIVE

REDIS:
  Container:  esperancar-redis.1.xg2u1b8idw4hy7vmxc5xg7rjs
  Status:     Up 14 hours (healthy)
  Porta:      6379/tcp

PRISMA:
  ✅ prisma validate → Schema válido
  ✅ prisma generate → Client gerado

STATUS: ✅ BANCO SAUDÁVEL
