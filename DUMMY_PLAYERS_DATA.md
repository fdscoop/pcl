# 7 Dummy Players for Testing

## Quick Setup

Run these migrations in order:

```bash
# 1. Add photo_url column to players table
psql -d your_database < supabase/migrations/005_add_player_photo_url.sql

# 2. Seed the dummy players
psql -d your_database < supabase/migrations/006_seed_dummy_players.sql
```

Or using Supabase CLI:
```bash
supabase db push
```

## Player Details

### 1. **Rahul Sharma** - Goalkeeper (GK)
- **Jersey**: #1
- **Position**: Goalkeeper
- **Height**: 185.5 cm
- **Weight**: 80 kg
- **Age**: 26 (Born: May 15, 1998)
- **Foot**: Right
- **Stats**: 45 matches, 0 goals, 2 assists
- **Email**: rahul.sharma@example.com
- **ID**: PCL-GK-2024-001

### 2. **Mohammed Ali** - Left Back (LB)
- **Jersey**: #3
- **Position**: Defender
- **Height**: 178 cm
- **Weight**: 75.5 kg
- **Age**: 25 (Born: Aug 22, 1999)
- **Foot**: Left
- **Stats**: 52 matches, 3 goals, 8 assists
- **Email**: mohammed.ali@example.com
- **ID**: PCL-DEF-2024-002

### 3. **Vikram Singh** - Center Back (CB)
- **Jersey**: #5
- **Position**: Defender
- **Height**: 182 cm
- **Weight**: 78 kg
- **Age**: 27 (Born: Mar 10, 1997)
- **Foot**: Right
- **Stats**: 68 matches, 5 goals, 4 assists
- **Email**: vikram.singh@example.com
- **ID**: PCL-DEF-2024-003

### 4. **Arjun Patel** - Central Midfielder (CM)
- **Jersey**: #8
- **Position**: Midfielder
- **Height**: 175.5 cm
- **Weight**: 72 kg
- **Age**: 24 (Born: Nov 5, 2000)
- **Foot**: Both
- **Stats**: 61 matches, 12 goals, 15 assists
- **Email**: arjun.patel@example.com
- **ID**: PCL-MID-2024-004

### 5. **Karan Reddy** - Attacking Midfielder (AM/CAM)
- **Jersey**: #10
- **Position**: Midfielder
- **Height**: 172 cm
- **Weight**: 68.5 kg
- **Age**: 23 (Born: Jan 18, 2001)
- **Foot**: Right
- **Stats**: 55 matches, 18 goals, 22 assists
- **Email**: karan.reddy@example.com
- **ID**: PCL-MID-2024-005

### 6. **Aditya Kumar** - Striker (ST)
- **Jersey**: #9
- **Position**: Forward
- **Height**: 180 cm
- **Weight**: 76 kg
- **Age**: 26 (Born: Jul 30, 1998)
- **Foot**: Right
- **Stats**: 70 matches, 35 goals, 12 assists
- **Email**: aditya.kumar@example.com
- **ID**: PCL-FWD-2024-006

### 7. **Rohan Desai** - Winger (LW/RW)
- **Jersey**: #7
- **Position**: Forward
- **Height**: 173.5 cm
- **Weight**: 70 kg
- **Age**: 24 (Born: Sep 12, 2000)
- **Foot**: Left
- **Stats**: 48 matches, 22 goals, 18 assists
- **Email**: rohan.desai@example.com
- **ID**: PCL-FWD-2024-007

## Squad Composition

- **Goalkeepers**: 1 (Rahul)
- **Defenders**: 2 (Mohammed, Vikram)
- **Midfielders**: 2 (Arjun, Karan)
- **Forwards**: 2 (Aditya, Rohan)

**Total**: 7 players - Perfect for testing 5-a-side format!

## Notes

- All players have `is_available_for_scout = true` so they appear in scout searches
- Profile photos use Unsplash placeholder images
- All players are Indian nationals
- Diverse positions for testing formations
- Stats are realistic for semi-professional players

## Testing Formations

With these 7 players, you can test:
- ✅ **5-a-side formations** (need 8 minimum - recruit 1 more!)
- ❌ 7-a-side (need 11 minimum - recruit 4 more)
- ❌ 11-a-side (need 14 minimum - recruit 7 more)

## Manual Insert (Alternative Method)

If you prefer to insert manually via Supabase dashboard or psql:

```sql
-- The SQL is in: supabase/migrations/006_seed_dummy_players.sql
-- Just copy and paste that file content
```
