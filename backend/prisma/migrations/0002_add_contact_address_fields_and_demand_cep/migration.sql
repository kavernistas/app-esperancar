-- Migration: add_contact_address_fields_and_demand_cep
-- Created: 2026-06-28
-- Applies schema changes for CRM contact full address and demand CEP

ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "complement" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "demands" ADD COLUMN IF NOT EXISTS "cep" TEXT;

-- Indexes for new fields
CREATE INDEX IF NOT EXISTS "contacts_state_idx" ON "contacts"("state");
