-- ============================================
-- CONTRACT SIGNATURE & PROFESSIONAL DISPLAY
-- Add fields for contract signing and management
-- ============================================

-- Add new columns to contracts table for signature tracking
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS club_signature_timestamp TIMESTAMP;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS club_signature_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS player_signature_timestamp TIMESTAMP;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS player_signature_data JSONB; -- Store signature details
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_html TEXT; -- Store generated HTML contract
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signing_status TEXT DEFAULT 'unsigned'; -- unsigned, club_signed, fully_signed

-- Create contract_templates table for storing PCL default policies
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  policy_type TEXT NOT NULL, -- 'anti_drug', 'general_terms', 'code_of_conduct', 'medical_requirements'
  content TEXT NOT NULL,
  html_template TEXT, -- HTML version
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(policy_type, version)
);

-- Clean up any existing duplicates before inserting
DELETE FROM contract_templates ct1
WHERE id NOT IN (
  SELECT DISTINCT ON (policy_type, version) id
  FROM contract_templates
  ORDER BY policy_type, version, created_at ASC
);

-- Insert PCL default policies (only if not already exists)
INSERT INTO contract_templates (name, version, policy_type, content, is_active) VALUES
('Anti-Drug Policy', '1.0', 'anti_drug', 
'ZERO TOLERANCE POLICY: Professional Club League maintains a strict zero-tolerance policy regarding the use, possession, distribution, or promotion of illegal drugs, narcotics, or banned substances.

INDIAN GOVERNMENT COMPLIANCE: This contract is executed in full compliance with the Government of India''s anti-drug initiatives and policies. The player acknowledges and supports the nation''s efforts to maintain a drug-free society.

MANDATORY TESTING: The player agrees to undergo regular drug testing as required by the club, league regulations, and government authorities. Random testing may be conducted without prior notice.

BREACH CONSEQUENCES: Any violation of this anti-drug policy will result in immediate contract termination, forfeiture of all benefits, and cooperation with law enforcement authorities as required by law.

PLAYER COMMITMENT: By signing this contract, the player commits to being a positive role model in society and actively supporting drug-free campaigns as promoted by the Government of India and PCL member clubs.',
true),

('General Terms & Conditions', '1.0', 'general_terms',
'1. CONTRACT BINDING: This contract is legally binding upon both parties and governed by professional football league regulations.

2. MEDICAL REQUIREMENTS: Player must maintain physical fitness standards as defined by club medical staff and undergo regular medical examinations, including mandatory drug testing.

3. TRAINING & DISCIPLINE: Player agrees to attend all scheduled training sessions, matches, and club activities unless excused by management for valid reasons.

4. CODE OF CONDUCT: Player must maintain professional behavior on and off the field, upholding the reputation and values of the club and serving as a positive role model in the community.

5. ANTI-DRUG COMMITMENT: Player commits to a drug-free lifestyle and agrees to support anti-drug campaigns as promoted by the Government of India and club initiatives.

6. INJURY & INSURANCE: Club provides comprehensive medical coverage for football-related injuries during official training and matches.

7. TERMINATION CLAUSE: Either party may terminate this contract with 30 days written notice, subject to financial settlements. Immediate termination applies for policy violations.

8. TRANSFER CLAUSE: Player transfers are subject to release clause payment and mutual agreement between all parties involved.

9. INTELLECTUAL PROPERTY: Any content created during employment (interviews, training videos, promotional materials) belongs to the club unless otherwise specified.

10. COMPLIANCE & LEGAL: Player agrees to comply with all applicable laws, regulations, and government policies.',
true)
ON CONFLICT DO NOTHING;

-- Verify tables
SELECT name, policy_type, is_active FROM contract_templates;
