# How to Apply Migration 025 Manually

Since `supabase db push` is failing on earlier migrations that are already applied, you need to apply migration 025 manually through the Supabase dashboard.

## Steps:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to SQL Editor** (left sidebar)
4. **Create a new query**
5. **Copy and paste the entire content** from: `supabase/migrations/025_add_payment_to_summary_trigger.sql`
6. **Click "Run"**

## Or use psql directly:

```bash
# Get your connection string from Supabase dashboard
# Then run:
psql "your-connection-string-here" < supabase/migrations/025_add_payment_to_summary_trigger.sql
```

## Verify it worked:

After applying, run this query to check:

```sql
-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_create_pending_payout_summaries';

-- Check if function exists  
SELECT proname 
FROM pg_proc 
WHERE proname = 'create_pending_payout_summaries_from_payment';

-- Both queries should return results
```

## Test with a completed payment:

```sql
-- Manually trigger the function on an existing completed payment
SELECT create_pending_payout_summaries_from_payment()
FROM payments
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 1;

-- Then check pending_payouts_summary table
SELECT * FROM pending_payouts_summary;
```
