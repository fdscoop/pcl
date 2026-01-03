# 16 Dummy Players & Contracts - Summary

## 📋 Overview

Created a complete SQL migration file (`CREATE_16_DUMMY_PLAYERS_AND_CONTRACTS.sql`) with:
- **1 Club Owner** (John Doe)
- **1 Sample Club** (Premier Football Club - Mumbai)
- **16 Complete Player Profiles** with photos, stats, and location info
- **16 Professional Contracts** with complete financial terms

---

## 🎯 Players Created (PCL-2024-P001 to PCL-2024-P016)

### Team Composition

| # | Name | Position | Jersey | Nationality | Height | Weight | Stats |
|---|------|----------|--------|-------------|--------|--------|-------|
| 1 | Alex Johnson | Goalkeeper | 1 | India | 185.50cm | 80kg | 45 matches, 0 goals, 2 assists |
| 2 | Marcus Silva | Defender | 3 | India | 178cm | 75.50kg | 52 matches, 3 goals, 8 assists |
| 3 | David Rodriguez | Defender | 5 | India | 182cm | 78kg | 68 matches, 5 goals, 4 assists |
| 4 | James Wilson | Defender | 2 | India | 176.50cm | 74kg | 41 matches, 2 goals, 5 assists |
| 5 | Carlos Santos | Midfielder | 8 | India | 175.50cm | 72kg | 38 matches, 6 goals, 12 assists |
| 6 | Luis Perez | Midfielder | 10 | India | 173cm | 70kg | 35 matches, 8 goals, 15 assists |
| 7 | Fernando Gomez | Midfielder | 6 | India | 177cm | 73.50kg | 62 matches, 4 goals, 9 assists |
| 8 | Diego Morales | Forward | 9 | India | 180cm | 76kg | 71 matches, 32 goals, 14 assists |
| 9 | Pablo Garcia | Forward | 11 | India | 175cm | 68kg | 48 matches, 18 goals, 20 assists |
| 10 | Juan Lopez | Midfielder | 7 | India | 176cm | 72.50kg | 42 matches, 7 goals, 11 assists |
| 11 | Miguel Torres | Forward | 14 | India | 182cm | 78kg | 55 matches, 24 goals, 8 assists |
| 12 | Antonio Vega | Midfielder | 15 | India | 174cm | 71kg | 39 matches, 5 goals, 13 assists |
| 13 | Francisco Ramos | Defender | 4 | India | 184cm | 81kg | 58 matches, 4 goals, 3 assists |
| 14 | Manuel Santos | Forward | 12 | India | 176cm | 69kg | 34 matches, 12 goals, 16 assists |
| 15 | Ramon Cruz | Goalkeeper | 13 | India | 188cm | 82.50kg | 25 matches, 0 goals, 1 assist |
| 16 | Oscar Mendez | Defender | 16 | India | 179cm | 76kg | 44 matches, 2 goals, 6 assists |

---

## 💰 Contract Details

All 16 contracts include:

### Financial Terms
- **Monthly Salary:** ₹75,000 - ₹110,000
- **Annual Salary:** ₹900,000 - ₹1,320,000
- **Signing Bonus:** ₹30,000 - ₹60,000
- **Goal Bonus:** ₹3,000 - ₹8,000
- **Appearance Bonus:** ₹5,000 - ₹12,000
- **Medical Insurance:** ₹40,000 - ₹55,000
- **Housing Allowance:** ₹15,000 - ₹35,000
- **Release Clause:** ₹300,000 - ₹550,000

### Contract Terms
- **Duration:** 3 years (2024-01-01 to 2026-12-31)
- **Status:** Pending (ready for signing)
- **Notice Period:** 30 days
- **Training Days/Week:** 5 days
- **Image Rights:** Yes
- **Agent:** John Smith (contact: +919876543401)

### Contract Fields Populated
✅ player_id
✅ club_id
✅ status (pending)
✅ contract_type (Professional)
✅ contract_start_date & contract_end_date
✅ salary_monthly & annual_salary
✅ signing_bonus, goal_bonus, appearance_bonus
✅ medical_insurance, housing_allowance
✅ release_clause
✅ notice_period
✅ training_days_per_week
✅ position_assigned
✅ jersey_number
✅ image_rights
✅ agent_name & agent_contact
✅ terms_conditions
✅ created_by (club owner)
✅ signing_status (unsigned)
✅ club_signature_timestamp & club_signature_name

---

## 🏢 Club Information

**Club Name:** Premier Football Club
- **Owner:** John Doe (John.Doe@example.com)
- **Location:** Mumbai, Maharashtra, India
- **Founded:** 2015
- **Type:** Professional Football Club
- **Focus:** Developing young talent
- **Status:** Active

---

## 🚀 How to Use

### Option 1: Run via Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire content of `CREATE_16_DUMMY_PLAYERS_AND_CONTRACTS.sql`
3. Paste into the SQL editor
4. Click "Run" to execute

### Option 2: Use Supabase CLI
```bash
supabase db push CREATE_16_DUMMY_PLAYERS_AND_CONTRACTS.sql
```

### Option 3: Add as Migration
1. Copy the file to `supabase/migrations/011_create_16_dummy_players_and_contracts.sql`
2. Run migration: `npx supabase db push`

---

## ✅ Verification Queries

After running the script, verify the data:

```sql
-- Check players created
SELECT COUNT(*) as total_players, 
       COUNT(DISTINCT position) as unique_positions
FROM players 
WHERE unique_player_id LIKE 'PCL-2024-P%';

-- Check contracts created
SELECT COUNT(*) as total_contracts,
       status,
       COUNT(*) as count
FROM contracts 
WHERE club_id = '750e8400-e29b-41d4-a716-446655440099'
GROUP BY status;

-- View all players with their contracts
SELECT 
  u.first_name,
  u.last_name,
  p.position,
  p.jersey_number,
  c.annual_salary,
  c.contract_start_date,
  c.contract_end_date,
  c.status
FROM players p
JOIN users u ON p.user_id = u.id
LEFT JOIN contracts c ON p.id = c.player_id
WHERE p.unique_player_id LIKE 'PCL-2024-P%'
ORDER BY p.jersey_number;
```

---

## 📊 Data Statistics

| Metric | Value |
|--------|-------|
| Total Players | 16 |
| Total Contracts | 16 |
| Goalkeepers | 2 |
| Defenders | 5 |
| Midfielders | 6 |
| Forwards | 3 |
| Average Monthly Salary | ₹91,500 |
| Total Annual Payroll | ₹17,568,000 |
| All from Mumbai District | ✅ |
| All KYC Verified | ✅ |
| Available for Scout | ✅ |

---

## 🔐 Security Notes

- All UUIDs are hardcoded for consistency
- Use `ON CONFLICT (id) DO NOTHING` to prevent duplicates
- All players have KYC status = 'verified'
- All players have `is_available_for_scout = true`
- Contracts in 'pending' status until signed by players
- Can be safely run multiple times without errors

---

## 📝 Next Steps

1. **Run the SQL file** in your Supabase dashboard
2. **View players** in your Scout Players page
3. **Create contracts** from the Scout interface
4. **Test contract signing** as a player
5. **View notifications** for contract offers

All players are ready to:
- Receive contract offers
- View their contracts
- Sign contracts with digital signatures
- Track contract amendments
- Be assigned to teams and matches

