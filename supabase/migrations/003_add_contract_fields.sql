-- Add additional contract fields to support comprehensive contract details

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'permanent',
  ADD COLUMN IF NOT EXISTS notice_period INTEGER,
  ADD COLUMN IF NOT EXISTS annual_salary DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS signing_bonus DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS release_clause DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS goal_bonus DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS appearance_bonus DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS medical_insurance DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS housing_allowance DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS image_rights TEXT,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS agent_contact TEXT;

-- Add check constraints
ALTER TABLE contracts
  ADD CONSTRAINT valid_contract_type CHECK (contract_type IN ('permanent', 'loan', 'trial', 'seasonal')),
  ADD CONSTRAINT valid_image_rights CHECK (image_rights IN ('yes', 'limited', 'no'));
