-- Migration 0003 — Foundation V2
-- Organization, user↔campaign context, audit, events

-- =============================================
-- ORGANIZATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS "organizations" (
  "id"          TEXT PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "slug"        TEXT UNIQUE NOT NULL,
  "document"    TEXT,
  "address"     TEXT,
  "phone"       TEXT,
  "email"       TEXT,
  "logo_url"    TEXT,
  "plan"        TEXT DEFAULT 'free',
  "status"      TEXT DEFAULT 'active',
  "settings"    JSONB DEFAULT '{}'::jsonb,
  "owner_id"    TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations"("slug");

-- =============================================
-- USER ↔ ORGANIZATION + ACTIVE CAMPAIGN
-- =============================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active_campaign_id" TEXT;

CREATE INDEX IF NOT EXISTS "users_organization_id_idx" ON "users"("organization_id");
CREATE INDEX IF NOT EXISTS "users_active_campaign_id_idx" ON "users"("active_campaign_id");

-- =============================================
-- MEMBERSHIPS (user↔campaign M:N)
-- =============================================
CREATE TABLE IF NOT EXISTS "memberships" (
  "id"              TEXT PRIMARY KEY,
  "user_id"         TEXT NOT NULL,
  "campaign_id"     TEXT,
  "organization_id" TEXT,
  "role"            TEXT DEFAULT 'OPERATOR',
  "permissions"     JSONB DEFAULT '[]'::jsonb,
  "territories"     JSONB DEFAULT '[]'::jsonb,
  "is_active"       BOOLEAN DEFAULT true,
  "joined_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "left_at"         TIMESTAMP(3),

  CONSTRAINT "memberships_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "memberships_campaign_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE,
  CONSTRAINT "memberships_org_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "memberships_user_id_idx" ON "memberships"("user_id");
CREATE INDEX IF NOT EXISTS "memberships_campaign_id_idx" ON "memberships"("campaign_id");
CREATE INDEX IF NOT EXISTS "memberships_org_id_idx" ON "memberships"("organization_id");

-- =============================================
-- CAMPAIGN ↔ ORGANIZATION
-- =============================================
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "created_by" TEXT;

CREATE INDEX IF NOT EXISTS "campaigns_organization_id_idx" ON "campaigns"("organization_id");

-- =============================================
-- AUDIT LOG
-- =============================================
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"           TEXT PRIMARY KEY,
  "organization_id" TEXT,
  "campaign_id"  TEXT,
  "user_id"      TEXT,
  "user_name"    TEXT,
  "action"       TEXT NOT NULL,
  "module"       TEXT,
  "entity"       TEXT,
  "entity_id"    TEXT,
  "entity_label" TEXT,
  "changes"      JSONB,
  "metadata"     JSONB,
  "ip_address"   TEXT,
  "user_agent"   TEXT,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_org_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL,
  CONSTRAINT "audit_logs_campaign_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL,
  CONSTRAINT "audit_logs_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "audit_logs_org_id_idx" ON "audit_logs"("organization_id");
CREATE INDEX IF NOT EXISTS "audit_logs_campaign_id_idx" ON "audit_logs"("campaign_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- =============================================
-- INTERNAL EVENTS (timeline)
-- =============================================
CREATE TABLE IF NOT EXISTS "internal_events" (
  "id"              TEXT PRIMARY KEY,
  "organization_id" TEXT,
  "campaign_id"     TEXT,
  "user_id"         TEXT,
  "type"            TEXT NOT NULL,
  "title"           TEXT,
  "description"     TEXT,
  "entity_type"     TEXT,
  "entity_id"       TEXT,
  "entity_label"    TEXT,
  "data"            JSONB,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "internal_events_org_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL,
  CONSTRAINT "internal_events_campaign_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL,
  CONSTRAINT "internal_events_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "internal_events_org_id_idx" ON "internal_events"("organization_id");
CREATE INDEX IF NOT EXISTS "internal_events_campaign_id_idx" ON "internal_events"("campaign_id");
CREATE INDEX IF NOT EXISTS "internal_events_type_idx" ON "internal_events"("type");
CREATE INDEX IF NOT EXISTS "internal_events_created_at_idx" ON "internal_events"("created_at");

-- =============================================
-- CONTACTS ↔ organization_id / campaign_id
-- =============================================
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "campaign_id" TEXT;

CREATE INDEX IF NOT EXISTS "contacts_organization_id_idx" ON "contacts"("organization_id");
-- campaign_id index already exists

-- =============================================
-- DEMANDS ↔ organization_id / campaign_id
-- =============================================
ALTER TABLE "demands" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "demands" ADD COLUMN IF NOT EXISTS "campaign_id" TEXT;

CREATE INDEX IF NOT EXISTS "demands_organization_id_idx" ON "demands"("organization_id");
CREATE INDEX IF NOT EXISTS "demands_campaign_id_idx" ON "demands"("campaign_id");

-- =============================================
-- MISSIONS ↔ organization_id / campaign_id
-- =============================================
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "campaign_id" TEXT;

CREATE INDEX IF NOT EXISTS "missions_organization_id_idx" ON "missions"("organization_id");
CREATE INDEX IF NOT EXISTS "missions_campaign_id_idx" ON "missions"("campaign_id");
