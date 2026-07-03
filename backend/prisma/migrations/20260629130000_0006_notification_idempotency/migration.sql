-- Migration 0006: notification_idempotency
-- Unique constraint para evitar notificacoes duplicadas do mesmo evento

CREATE UNIQUE INDEX IF NOT EXISTS "notifications_event_id_user_id_type_key"
  ON "notifications" ("event_id", "user_id", "type")
  WHERE "event_id" IS NOT NULL;
