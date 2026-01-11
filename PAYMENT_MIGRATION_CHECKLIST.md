# Payment Migration Checklist

## 📋 Quick Reference - Run These in Order

### In Supabase SQL Editor (https://supabase.com/dashboard)

- [ ] 1. Run `CREATE_PAYMENTS_TABLE.sql`
- [ ] 2. Run `CREATE_BOOKINGS_TABLE.sql`
- [ ] 3. Run `CREATE_PAYOUTS_TABLE.sql`
- [ ] 4. Run `ADD_PAYMENT_FIELDS_TO_MATCHES.sql`
- [ ] 5. Run `CREATE_PAYMENT_VIEWS.sql`
- [ ] 6. Run `ADD_PAYMENT_RLS_POLICIES.sql`

### Verification (Run in Supabase SQL Editor)

```sql
-- Check tables exist (should return 3)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('payments', 'bookings', 'payouts');

-- Check views exist (should return 6)
SELECT COUNT(*) FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN (
    'stadium_owner_bookings',
    'referee_bookings', 
    'staff_bookings',
    'admin_financial_overview',
    'club_payment_history',
    'pending_payouts_summary'
  );

-- Test views work (should return 0 rows but no error)
SELECT * FROM stadium_owner_bookings LIMIT 1;
SELECT * FROM referee_bookings LIMIT 1;
SELECT * FROM admin_financial_overview LIMIT 1;
```

### After Migration

- [ ] Configure Razorpay webhook: `https://your-domain.com/api/webhooks/razorpay`
- [ ] Test payment flow with Razorpay test card
- [ ] Verify webhook creates booking records
- [ ] Build frontend payment UI (Step 6 in match creation)
- [ ] Build dashboard components (stadium owner, referee, staff, admin)

---

## 🎯 Files to Run (in order)

1. **CREATE_PAYMENTS_TABLE.sql** - Main payment tracking
2. **CREATE_BOOKINGS_TABLE.sql** - Individual bookings per resource
3. **CREATE_PAYOUTS_TABLE.sql** - Vendor payout management
4. **ADD_PAYMENT_FIELDS_TO_MATCHES.sql** - Links matches to payments
5. **CREATE_PAYMENT_VIEWS.sql** - Dashboard views (6 views)
6. **ADD_PAYMENT_RLS_POLICIES.sql** - Security policies

---

## ✅ Success Indicators

- All 6 SQL files run without errors
- 3 new tables created: `payments`, `bookings`, `payouts`
- 6 views created: `*_bookings`, `*_overview`, `*_history`, `*_summary`
- 4 columns added to `matches` table
- RLS policies enabled and configured

---

**See `APPLY_PAYMENT_MIGRATIONS_GUIDE.md` for detailed instructions**
