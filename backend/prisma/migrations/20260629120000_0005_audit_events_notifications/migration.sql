-- Migration 0005: audit_events_notifications
-- Aplicar manualmente via docker exec (P3006 shadow DB issue)

-- ============================================================
-- 1. AUDIT_LOGS: adicionar request_id
-- ============================================================
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "request_id" TEXT;
CREATE INDEX IF NOT EXISTS "audit_logs_request_id_idx" ON "audit_logs"("request_id");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entity_id_created_at_idx" ON "audit_logs"("entity", "entity_id", "created_at");

-- ============================================================
-- 2. INTERNAL_EVENTS: extender schema
-- ============================================================
ALTER TABLE "internal_events"
  ADD COLUMN IF NOT EXISTS "event_name" TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS "event_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "aggregate_type" TEXT,
  ADD COLUMN IF NOT EXISTS "aggregate_id" TEXT,
  ADD COLUMN IF NOT EXISTS "payload" JSONB,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB,
  ADD COLUMN IF NOT EXISTS "correlation_id" TEXT,
  ADD COLUMN IF NOT EXISTS "request_id" TEXT,
  ADD COLUMN IF NOT EXISTS "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "processed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "processing_error" TEXT;

-- Atualizar event_name baseado no type existente
UPDATE "internal_events" SET "event_name" = "type" WHERE "event_name" = 'legacy' AND "type" IS NOT NULL;

-- Recriar indices
DROP INDEX IF EXISTS "internal_events_organization_id_idx";
DROP INDEX IF EXISTS "internal_events_campaign_id_idx";
DROP INDEX IF EXISTS "internal_events_type_idx";
DROP INDEX IF EXISTS "internal_events_created_at_idx";

CREATE INDEX IF NOT EXISTS "internal_events_organization_id_occurred_at_idx" ON "internal_events"("organization_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "internal_events_event_name_occurred_at_idx" ON "internal_events"("event_name", "occurred_at");
CREATE INDEX IF NOT EXISTS "internal_events_aggregate_type_aggregate_id_occurred_at_idx" ON "internal_events"("aggregate_type", "aggregate_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "internal_events_correlation_id_idx" ON "internal_events"("correlation_id");
CREATE INDEX IF NOT EXISTS "internal_events_processed_at_idx" ON "internal_events"("processed_at");

-- ============================================================
-- 3. NOTIFICATIONS: extender schema
-- ============================================================
ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "organization_id" TEXT,
  ADD COLUMN IF NOT EXISTS "campaign_id" TEXT,
  ADD COLUMN IF NOT EXISTS "event_id" TEXT,
  ADD COLUMN IF NOT EXISTS "entity_type" TEXT,
  ADD COLUMN IF NOT EXISTS "action_url" TEXT,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB,
  ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);

-- Migrar dados: read=true -> read_at = created_at
UPDATE "notifications" SET "read_at" = "created_at" WHERE "read" = true;

-- Dropar colunas antigas (verificar se nao ha dependencias primeiro)
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "read";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "link";
ALTER TABLE "notifications" DROP COLUMN IF NOT EXISTS "updated_at";

-- Recriar indices
DROP INDEX IF EXISTS "notifications_user_id_idx";
DROP INDEX IF EXISTS "notifications_read_idx";

CREATE INDEX IF NOT EXISTS "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_organization_id_user_id_created_at_idx" ON "notifications"("organization_id", "user_id", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_campaign_id_user_id_created_at_idx" ON "notifications"("campaign_id", "user_id", "created_at");

-- Foreign keys (opcional — pode ser adicionado depois se necessario)
-- ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE "notifications" ADD CONSTRAINT "notifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "internal_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 4. NOTIFICATION_PREFERENCES: criar tabela
-- ============================================================
CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "user_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "in_app" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_organization_id_user_id_event_name_key" ON "notification_preferences"("organization_id", "user_id", "event_name");

-- FKs para notification_preferences
-- ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
