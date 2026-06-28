-- Seed Foundation V2: create default organization, campaign, membership, and backfill context

-- =============================================
-- ORGANIZAÇÃO PADRÃO
-- =============================================
INSERT INTO organizations (id, name, slug, plan, status, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Esperançar',
  'esperancar',
  'free',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- CAMPAIGNA PADRÃO
-- =============================================
INSERT INTO campaigns (
  id, name, type, year, status, vote_goal, budget,
  organization_id, settings, created_by,
  created_at, updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000011',
  'Campanha Principal 2026',
  'MUNICIPAL',
  2026,
  'ACTIVE',
  0,
  0,
  '00000000-0000-0000-0000-000000000010',
  '{}'::jsonb,
  u.id,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'dralanrobertoferreira@gmail.com'
ON CONFLICT DO NOTHING;

-- =============================================
-- MEMBERSHIP ADMIN
-- =============================================
INSERT INTO memberships (
  id, user_id, organization_id, campaign_id,
  role, permissions, territories, is_active,
  joined_at
)
SELECT
  '00000000-0000-0000-0000-000000000012',
  u.id,
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  'ADMIN',
  '["*"]'::jsonb,
  '[]'::jsonb,
  true,
  CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'dralanrobertoferreira@gmail.com'
ON CONFLICT DO NOTHING;

-- =============================================
-- BACKFILL USERS
-- =============================================
UPDATE users
SET
  organization_id = '00000000-0000-0000-0000-000000000010',
  active_campaign_id = '00000000-0000-0000-0000-000000000011'
WHERE organization_id IS NULL;

-- =============================================
-- BACKFILL CONTACTS
-- =============================================
UPDATE contacts
SET
  organization_id = '00000000-0000-0000-0000-000000000010',
  campaign_id = '00000000-0000-0000-0000-000000000011'
WHERE organization_id IS NULL;

-- =============================================
-- BACKFILL DEMANDS
-- =============================================
UPDATE demands
SET
  organization_id = '00000000-0000-0000-0000-000000000010',
  campaign_id = '00000000-0000-0000-0000-000000000011'
WHERE organization_id IS NULL;

-- =============================================
-- BACKFILL MISSIONS
-- =============================================
UPDATE missions
SET
  organization_id = '00000000-0000-0000-0000-000000000010',
  campaign_id = '00000000-0000-0000-0000-000000000011'
WHERE organization_id IS NULL;

-- =============================================
-- AUDIT EVENT: organization created
-- =============================================
INSERT INTO internal_events (
  id, organization_id, campaign_id, user_id,
  type, title, description, entity_type, entity_id,
  entity_label, data, created_at
)
SELECT
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  u.id,
  'organization.created',
  'Organização Esperançar criada',
  'Organização padrão para dados históricos',
  'organization',
  '00000000-0000-0000-0000-000000000010',
  'Esperançar',
  '{"source":"seed","backfill":true}'::jsonb,
  CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'dralanrobertoferreira@gmail.com';
