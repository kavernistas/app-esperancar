-- Migration 0004_users_teams_permissions
-- Adiciona: teams, team_memberships, invitations, role_permissions, user.invited_at
-- =============================================
-- TEAMS
-- =============================================
CREATE TABLE IF NOT EXISTS "teams" (
  "id"              TEXT PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "campaign_id"     TEXT,
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "active"          BOOLEAN DEFAULT true,
  "created_by"      TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"      TIMESTAMP(3),
  CONSTRAINT "teams_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "teams_campaign_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "teams_organization_id_idx" ON "teams"("organization_id");
CREATE INDEX IF NOT EXISTS "teams_campaign_id_idx" ON "teams"("campaign_id");
-- =============================================
-- TEAM MEMBERSHIPS
-- =============================================
CREATE TABLE IF NOT EXISTS "team_memberships" (
  "id"         TEXT PRIMARY KEY,
  "team_id"    TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "role"       TEXT DEFAULT 'MEMBER',
  "active"     BOOLEAN DEFAULT true,
  "joined_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "left_at"    TIMESTAMP(3),
  CONSTRAINT "team_memberships_team_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE,
  CONSTRAINT "team_memberships_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "team_memberships_team_user_key" ON "team_memberships"("team_id", "user_id");
CREATE INDEX IF NOT EXISTS "team_memberships_user_id_idx" ON "team_memberships"("user_id");
-- =============================================
-- INVITATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS "invitations" (
  "id"              TEXT PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "campaign_id"     TEXT,
  "email"           TEXT NOT NULL,
  "role"            TEXT DEFAULT 'OPERADOR',
  "token_hash"      TEXT NOT NULL UNIQUE,
  "expires_at"      TIMESTAMP(3) NOT NULL,
  "accepted_at"     TIMESTAMP(3),
  "invited_by"      TEXT NOT NULL,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invitations_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "invitations_campaign_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "invitations_organization_id_idx" ON "invitations"("organization_id");
CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations"("email");
CREATE INDEX IF NOT EXISTS "invitations_token_hash_idx" ON "invitations"("token_hash");
-- =============================================
-- ROLE PERMISSIONS
-- =============================================
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "id"         TEXT PRIMARY KEY,
  "role"       TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_permission_key" ON "role_permissions"("role", "permission");
CREATE INDEX IF NOT EXISTS "role_permissions_role_idx" ON "role_permissions"("role");
-- =============================================
-- USER — campo invited_at para tracking
-- =============================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invited_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_organization_id_role_idx" ON "users"("organization_id", "role");
-- =============================================
$
-- =============================================
INSERT INTO "role_permissions" (id, role, permission) VALUES
  (gen_random_uuid()::text, 'ADMIN', 'organizations.read'),
  (gen_random_uuid()::text, 'ADMIN', 'organizations.update'),
  (gen_random_uuid()::text, 'ADMIN', 'members.read'),
  (gen_random_uuid()::text, 'ADMIN', 'members.invite'),
  (gen_random_uuid()::text, 'ADMIN', 'members.update'),
  (gen_random_uuid()::text, 'ADMIN', 'members.deactivate'),
  (gen_random_uuid()::text, 'ADMIN', 'members.remove'),
  (gen_random_uuid()::text, 'ADMIN', 'campaigns.read'),
  (gen_random_uuid()::text, 'ADMIN', 'campaigns.create'),
  (gen_random_uuid()::text, 'ADMIN', 'campaigns.update'),
  (gen_random_uuid()::text, 'ADMIN', 'campaigns.activate'),
  (gen_random_uuid()::text, 'ADMIN', 'campaigns.archive'),
  (gen_random_uuid()::text, 'ADMIN', 'contacts.read'),
  (gen_random_uuid()::text, 'ADMIN', 'contacts.create'),
  (gen_random_uuid()::text, 'ADMIN', 'contacts.update'),
  (gen_random_uuid()::text, 'ADMIN', 'contacts.delete'),
  (gen_random_uuid()::text, 'ADMIN', 'contacts.export'),
  (gen_random_uuid()::text, 'ADMIN', 'demands.read'),
  (gen_random_uuid()::text, 'ADMIN', 'demands.create'),
  (gen_random_uuid()::text, 'ADMIN', 'demands.update'),
  (gen_random_uuid()::text, 'ADMIN', 'demands.assign'),
  (gen_random_uuid()::text, 'ADMIN', 'demands.close'),
  (gen_random_uuid()::text, 'ADMIN', 'demands.delete'),
  (gen_random_uuid()::text, 'ADMIN', 'missions.read'),
  (gen_random_uuid()::text, 'ADMIN', 'missions.create'),
  (gen_random_uuid()::text, 'ADMIN', 'missions.update'),
  (gen_random_uuid()::text, 'ADMIN', 'missions.assign'),
  (gen_random_uuid()::text, 'ADMIN', 'missions.complete'),
  (gen_random_uuid()::text, 'ADMIN', 'missions.approve'),
  (gen_random_uuid()::text, 'ADMIN', 'missions.delete'),
  (gen_random_uuid()::text, 'ADMIN', 'teams.read'),
  (gen_random_uuid()::text, 'ADMIN', 'teams.create'),
  (gen_random_uuid()::text, 'ADMIN', 'teams.update'),
  (gen_random_uuid()::text, 'ADMIN', 'teams.manage_members'),
  (gen_random_uuid()::text, 'ADMIN', 'teams.delete'),
  (gen_random_uuid()::text, 'ADMIN', 'reports.read'),
  (gen_random_uuid()::text, 'ADMIN', 'reports.export'),
  (gen_random_uuid()::text, 'ADMIN', 'finance.read'),
  (gen_random_uuid()::text, 'ADMIN', 'finance.create'),
  (gen_random_uuid()::text, 'ADMIN', 'finance.update'),
  (gen_random_uuid()::text, 'ADMIN', 'finance.approve'),
  (gen_random_uuid()::text, 'ADMIN', 'communications.read'),
  (gen_random_uuid()::text, 'ADMIN', 'communications.create'),
  (gen_random_uuid()::text, 'ADMIN', 'communications.send'),
  (gen_random_uuid()::text, 'ADMIN', 'communications.approve'),
  (gen_random_uuid()::text, 'ADMIN', 'audit.read'),
  (gen_random_uuid()::text, 'ADMIN', 'users.manage'),
  (gen_random_uuid()::text, 'ADMIN', 'roles.manage'),
  -- COORDENADOR
  (gen_random_uuid()::text, 'COORDENADOR', 'contacts.read'),
  (gen_random_uuid()::text, 'COORDENADOR', 'contacts.create'),
  (gen_random_uuid()::text, 'COORDENADOR', 'contacts.update'),
  (gen_random_uuid()::text, 'COORDENADOR', 'contacts.export'),
  (gen_random_uuid()::text, 'COORDENADOR', 'demands.read'),
  (gen_random_uuid()::text, 'COORDENADOR', 'demands.create'),
  (gen_random_uuid()::text, 'COORDENADOR', 'demands.update'),
  (gen_random_uuid()::text, 'COORDENADOR', 'demands.assign'),
  (gen_random_uuid()::text, 'COORDENADOR', 'demands.close'),
  (gen_random_uuid()::text, 'COORDENADOR', 'missions.read'),
  (gen_random_uuid()::text, 'COORDENADOR', 'missions.create'),
  (gen_random_uuid()::text, 'COORDENADOR', 'missions.update'),
  (gen_random_uuid()::text, 'COORDENADOR', 'missions.assign'),
  (gen_random_uuid()::text, 'COORDENADOR', 'missions.complete'),
  (gen_random_uuid()::text, 'COORDENADOR', 'campaigns.read'),
  (gen_random_uuid()::text, 'COORDENADOR', 'campaigns.create'),
  (gen_random_uuid()::text, 'COORDENADOR', 'campaigns.update'),
  (gen_random_uuid()::text, 'COORDENADOR', 'campaigns.activate'),
  (gen_random_uuid()::text, 'COORDENADOR', 'campaigns.archive'),
  (gen_random_uuid()::text, 'COORDENADOR', 'teams.read'),
  (gen_random_uuid()::text, 'COORDENADOR', 'teams.create'),
  (gen_random_uuid()::text, 'COORDENADOR', 'teams.update'),
  (gen_random_uuid()::text, 'COORDENADOR', 'teams.manage_members'),
  (gen_random_uuid()::text, 'COORDENADOR', 'reports.read'),
  (gen_random_uuid()::text, 'COORDENADOR', 'reports.export'),
  (gen_random_uuid()::text, 'COORDENADOR', 'members.read'),
  -- LIDERANCA
  (gen_random_uuid()::text, 'LIDERANCA', 'contacts.read'),
  (gen_random_uuid()::text, 'LIDERANCA', 'contacts.create'),
  (gen_random_uuid()::text, 'LIDERANCA', 'demands.read'),
  (gen_random_uuid()::text, 'LIDERANCA', 'demands.create'),
  (gen_random_uuid()::text, 'LIDERANCA', 'missions.read'),
  (gen_random_uuid()::text, 'LIDERANCA', 'missions.complete'),
  (gen_random_uuid()::text, 'LIDERANCA', 'teams.read'),
  -- OPERADOR
  (gen_random_uuid()::text, 'OPERADOR', 'contacts.read'),
  (gen_random_uuid()::text, 'OPERADOR', 'contacts.create'),
  (gen_random_uuid()::text, 'OPERADOR', 'contacts.update'),
  (gen_random_uuid()::text, 'OPERADOR', 'demands.read'),
  (gen_random_uuid()::text, 'OPERADOR', 'demands.create'),
  (gen_random_uuid()::text, 'OPERADOR', 'demands.update'),
  (gen_random_uuid()::text, 'OPERADOR', 'missions.read'),
  (gen_random_uuid()::text, 'OPERADOR', 'missions.update'),
  -- FINANCEIRO
  (gen_random_uuid()::text, 'FINANCEIRO', 'finance.read'),
  (gen_random_uuid()::text, 'FINANCEIRO', 'finance.create'),
  (gen_random_uuid()::text, 'FINANCEIRO', 'finance.update'),
  (gen_random_uuid()::text, 'FINANCEIRO', 'finance.approve'),
  (gen_random_uuid()::text, 'FINANCEIRO', 'reports.read'),
  (gen_random_uuid()::text, 'FINANCEIRO', 'reports.export'),
  -- COMUNICACAO
  (gen_random_uuid()::text, 'COMUNICACAO', 'communications.read'),
  (gen_random_uuid()::text, 'COMUNICACAO', 'communications.create'),
  (gen_random_uuid()::text, 'COMUNICACAO', 'contacts.read'),
  (gen_random_uuid()::text, 'COMUNICACAO', 'contacts.export'),
  -- LEITURA
  (gen_random_uuid()::text, 'LEITURA', 'contacts.read'),
  (gen_random_uuid()::text, 'LEITURA', 'demands.read'),
  (gen_random_uuid()::text, 'LEITURA', 'missions.read'),
  (gen_random_uuid()::text, 'LEITURA', 'campaigns.read'),
  (gen_random_uuid()::text, 'LEITURA', 'teams.read'),
  (gen_random_uuid()::text, 'LEITURA', 'reports.read')
ON CONFLICT (role, permission) DO NOTHING;
