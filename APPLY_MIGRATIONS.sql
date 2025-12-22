-- ============================================
-- COMPLETE MIGRATION SCRIPT FOR CONTRACT FEATURES
-- Run this in your Supabase SQL Editor
-- ============================================

-- First, check if contracts table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contracts') THEN
        -- Create contract_status enum if not exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
            CREATE TYPE contract_status AS ENUM ('active', 'terminated', 'amended', 'pending', 'rejected');
        END IF;

        -- Create contracts table
        CREATE TABLE contracts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
          status contract_status DEFAULT 'pending',
          contract_start_date DATE NOT NULL,
          contract_end_date DATE NOT NULL,
          salary_monthly DECIMAL(12, 2),
          position_assigned TEXT,
          jersey_number INTEGER,
          terms_conditions TEXT,
          created_by UUID NOT NULL REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          terminated_at TIMESTAMP,
          terminated_by UUID REFERENCES users(id),
          termination_reason TEXT,
          deleted_at TIMESTAMP,

          CONSTRAINT contract_date_check CHECK (contract_end_date > contract_start_date),
          CONSTRAINT single_active_contract UNIQUE (player_id, club_id, status) WHERE status = 'active'
        );

        -- Create indexes
        CREATE INDEX idx_contracts_player_id ON contracts(player_id);
        CREATE INDEX idx_contracts_club_id ON contracts(club_id);
        CREATE INDEX idx_contracts_status ON contracts(status);
    END IF;
END $$;

-- Add new columns for comprehensive contract details
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

-- Add check constraints (drop first if they exist)
DO $$
BEGIN
    -- Drop existing constraints if they exist
    ALTER TABLE contracts DROP CONSTRAINT IF EXISTS valid_contract_type;
    ALTER TABLE contracts DROP CONSTRAINT IF EXISTS valid_image_rights;

    -- Add new constraints
    ALTER TABLE contracts
      ADD CONSTRAINT valid_contract_type CHECK (contract_type IN ('permanent', 'loan', 'trial', 'seasonal')),
      ADD CONSTRAINT valid_image_rights CHECK (image_rights IN ('yes', 'limited', 'no'));
END $$;

-- Verify the table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'contracts'
ORDER BY ordinal_position;
