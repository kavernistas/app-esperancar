ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS assigned_to_id TEXT;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to_id
  ON contacts(assigned_to_id);

CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to_name
  ON contacts(assigned_to_name);
