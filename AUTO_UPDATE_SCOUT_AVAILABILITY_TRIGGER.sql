-- ============================================
-- AUTO UPDATE SCOUT AVAILABILITY TRIGGER
-- Automatically sets is_available_for_scout = true when:
-- 1. Contract is expired/terminated AND KYC is verified
-- 2. No active contract found AND KYC is verified
-- 3. Contract is rejected AND KYC is verified
-- ============================================

-- Step 1: Create function to check and update scout availability
CREATE OR REPLACE FUNCTION update_player_scout_availability()
RETURNS TRIGGER AS $$
DECLARE
    player_user_id UUID;
    player_kyc_status TEXT;
    active_contract_count INTEGER;
BEGIN
    -- Handle contract changes (INSERT, UPDATE, DELETE)
    IF TG_TABLE_NAME = 'contracts' THEN
        -- Get the player_id from the contract (use NEW for INSERT/UPDATE, OLD for DELETE)
        IF TG_OP = 'DELETE' THEN
            -- Contract was deleted, check if player should be available
            PERFORM update_scout_availability_for_player(OLD.player_id);
        ELSE
            -- Contract was inserted/updated, check if player should be available
            PERFORM update_scout_availability_for_player(NEW.player_id);
        END IF;
        
        -- Return appropriate record
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    -- Handle users table changes (KYC verification updates)
    IF TG_TABLE_NAME = 'users' THEN
        -- Only process if kyc_status changed to 'verified'
        IF NEW.kyc_status = 'verified' AND (OLD.kyc_status IS NULL OR OLD.kyc_status != 'verified') THEN
            -- Find all players for this user and update their availability
            UPDATE players 
            SET is_available_for_scout = (
                SELECT check_player_scout_eligibility(players.id)
            )
            WHERE user_id = NEW.id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create helper function to check player eligibility
CREATE OR REPLACE FUNCTION check_player_scout_eligibility(player_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    player_user_id UUID;
    player_kyc_status TEXT;
    has_active_contract BOOLEAN := FALSE;
    has_expired_contract BOOLEAN := FALSE;
BEGIN
    -- Get player's user info and KYC status
    SELECT p.user_id, u.kyc_status
    INTO player_user_id, player_kyc_status
    FROM players p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = player_id_param;
    
    -- If player not found or KYC not verified, not eligible
    IF player_user_id IS NULL OR player_kyc_status != 'verified' THEN
        RETURN FALSE;
    END IF;
    
    -- Check for active contracts
    SELECT EXISTS(
        SELECT 1 FROM contracts 
        WHERE player_id = player_id_param 
        AND status = 'active'
        AND (contract_end_date IS NULL OR contract_end_date > CURRENT_DATE)
    ) INTO has_active_contract;
    
    -- If has active contract, not available for scout
    IF has_active_contract THEN
        RETURN FALSE;
    END IF;
    
    -- Check for expired or terminated contracts (these make player available)
    SELECT EXISTS(
        SELECT 1 FROM contracts 
        WHERE player_id = player_id_param 
        AND (
            status IN ('terminated', 'rejected') OR
            (status = 'active' AND contract_end_date <= CURRENT_DATE)
        )
    ) INTO has_expired_contract;
    
    -- Player is available if:
    -- 1. KYC verified AND no active contracts (regardless of past contracts)
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create helper function to update specific player
CREATE OR REPLACE FUNCTION update_scout_availability_for_player(player_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE players 
    SET is_available_for_scout = check_player_scout_eligibility(player_id_param),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = player_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_scout_availability_on_contracts ON contracts;
DROP TRIGGER IF EXISTS trigger_update_scout_availability_on_users ON users;

-- Step 5: Create triggers
CREATE TRIGGER trigger_update_scout_availability_on_contracts
    AFTER INSERT OR UPDATE OR DELETE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_player_scout_availability();

CREATE TRIGGER trigger_update_scout_availability_on_users
    AFTER UPDATE OF kyc_status ON users
    FOR EACH ROW
    WHEN (NEW.kyc_status = 'verified')
    EXECUTE FUNCTION update_player_scout_availability();

-- Step 6: Update all existing players to correct availability status
-- (Run this once to fix historical data)
UPDATE players 
SET is_available_for_scout = check_player_scout_eligibility(id),
    updated_at = CURRENT_TIMESTAMP;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_player_status_end_date 
ON contracts(player_id, status, contract_end_date);

CREATE INDEX IF NOT EXISTS idx_players_scout_availability 
ON players(is_available_for_scout, user_id);

-- Step 8: Add helpful comments
COMMENT ON FUNCTION update_player_scout_availability() IS 'Automatically updates player scout availability when contracts or KYC status changes';
COMMENT ON FUNCTION check_player_scout_eligibility(UUID) IS 'Returns true if player is eligible for scouting (KYC verified + no active contracts)';
COMMENT ON FUNCTION update_scout_availability_for_player(UUID) IS 'Updates scout availability for a specific player';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test 1: Check players with verified KYC but no active contracts (should be available)
SELECT p.id, p.unique_player_id, u.email, u.kyc_status, p.is_available_for_scout,
       COUNT(c.id) FILTER (WHERE c.status = 'active') as active_contracts
FROM players p
JOIN users u ON p.user_id = u.id
LEFT JOIN contracts c ON c.player_id = p.id AND c.status = 'active'
WHERE u.kyc_status = 'verified'
GROUP BY p.id, p.unique_player_id, u.email, u.kyc_status, p.is_available_for_scout
ORDER BY p.unique_player_id;

-- Test 2: Check players with active contracts (should NOT be available)
SELECT p.id, p.unique_player_id, u.email, p.is_available_for_scout, c.status, c.contract_end_date
FROM players p
JOIN users u ON p.user_id = u.id
JOIN contracts c ON c.player_id = p.id
WHERE c.status = 'active'
ORDER BY p.unique_player_id;

-- Test 3: Show the logic working - count by availability status
SELECT 
    is_available_for_scout,
    COUNT(*) as player_count,
    COUNT(CASE WHEN u.kyc_status = 'verified' THEN 1 END) as verified_kyc_count
FROM players p
JOIN users u ON p.user_id = u.id
GROUP BY is_available_for_scout
ORDER BY is_available_for_scout;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT '✅ AUTO SCOUT AVAILABILITY TRIGGER INSTALLED SUCCESSFULLY!' as status,
       'Players will now automatically become available for scouting when contracts end or KYC is verified' as description;