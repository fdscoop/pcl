# Apply Payment & Booking Database Migrations

## 🎯 Overview
This guide walks you through applying all payment and booking system migrations to your Supabase database.

## ⚠️ Prerequisites
- Supabase project access
- Database admin privileges
- Backup your database (recommended)

## 📝 Migration Steps

### Step 1: Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your PCL project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

---

### Step 2: Create Payments Table
**File:** `CREATE_PAYMENTS_TABLE.sql`

Copy and paste the entire contents of this file into the SQL editor and run it.

**What it does:**
- Creates `payments` table to track Razorpay transactions
- Stores order_id, payment_id, signature for verification
- Tracks payment status, refunds, and metadata
- Links payments to clubs and matches

**Expected Output:** ✅ Success (no error)

---

### Step 3: Create Bookings Table
**File:** `CREATE_BOOKINGS_TABLE.sql`

Copy and paste the entire contents of this file into the SQL editor and run it.

**What it does:**
- Creates `bookings` table for individual resource bookings
- Tracks stadium, referee, and staff bookings separately
- Stores commission (10%) and net payout amounts
- Links bookings to payments and matches

**Expected Output:** ✅ Success (no error)

---

### Step 4: Create Payouts Table
**File:** `CREATE_PAYOUTS_TABLE.sql`

Copy and paste the entire contents of this file into the SQL editor and run it.

**What it does:**
- Creates `payouts` table for vendor payments
- Supports batch payouts to multiple bookings
- Tracks bank transfer details and status
- Links multiple bookings to single payout

**Expected Output:** ✅ Success (no error)

---

### Step 5: Add Payment Fields to Matches
**File:** `ADD_PAYMENT_FIELDS_TO_MATCHES.sql`

Copy and paste the entire contents of this file into the SQL editor and run it.

**What it does:**
- Adds `payment_id` column to matches table
- Adds `payment_status` column (pending, completed, failed, refunded)
- Adds `total_cost` and `cost_breakdown` JSONB columns
- Creates index for faster payment queries

**Expected Output:** ✅ Success (no error)

---

### Step 6: Create Dashboard Views
**File:** `CREATE_PAYMENT_VIEWS.sql`

Copy and paste the entire contents of this file into the SQL editor and run it.

**What it does:**
- Creates `stadium_owner_bookings` view
- Creates `referee_bookings` view
- Creates `staff_bookings` view
- Creates `admin_financial_overview` view
- Creates `club_payment_history` view
- Creates `pending_payouts_summary` view

**Expected Output:** ✅ Success (6 views created)

---

### Step 7: Add Row Level Security Policies
**File:** `ADD_PAYMENT_RLS_POLICIES.sql`

Copy and paste the entire contents of this file into the SQL editor and run it.

**What it does:**
- Enables RLS on payments, bookings, and payouts tables
- Adds policies for club owners (can view their own payments)
- Adds policies for stadium owners (can view their bookings)
- Adds policies for referees (can view their bookings)
- Adds policies for staff (can view their bookings)
- Adds policies for admins (can view/manage everything)

**Expected Output:** ✅ Success (no error)

---

## 🧪 Verify Migrations

After running all migrations, verify they were applied successfully:

### 1. Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('payments', 'bookings', 'payouts');
```

**Expected:** 3 rows returned

### 2. Check Views Exist
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE '%booking%' OR table_name LIKE '%payout%';
```

**Expected:** 6 rows returned

### 3. Check Matches Columns Added
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches' 
  AND column_name IN ('payment_id', 'payment_status', 'total_cost', 'cost_breakdown');
```

**Expected:** 4 rows returned

### 4. Test a View Query
```sql
-- Should return empty result (no data yet) but no error
SELECT * FROM stadium_owner_bookings LIMIT 1;
SELECT * FROM referee_bookings LIMIT 1;
SELECT * FROM admin_financial_overview LIMIT 1;
```

**Expected:** ✅ Query runs successfully (0 rows returned is OK)

---

## 📊 Database Schema Summary

After migrations, your database will have:

### New Tables (3)
1. **payments** - Razorpay transaction records
2. **bookings** - Individual resource bookings with commission
3. **payouts** - Batch payout records to vendors

### Modified Tables (1)
1. **matches** - Added payment tracking fields

### New Views (6)
1. **stadium_owner_bookings** - Stadium owner dashboard
2. **referee_bookings** - Referee dashboard
3. **staff_bookings** - Staff dashboard
4. **admin_financial_overview** - Admin financial metrics
5. **club_payment_history** - Club payment records
6. **pending_payouts_summary** - Payouts ready to process

### Relationships
```
payments (1) → (many) bookings
bookings (many) → (1) payouts
payments (1) → (1) matches
bookings (1) → (1) matches
bookings (1) → (1) stadiums/users (resource_id)
```

---

## 🐛 Troubleshooting

### Error: "relation already exists"
**Solution:** Table/view already created. Skip that migration or drop and recreate:
```sql
DROP TABLE IF EXISTS payments CASCADE;
DROP VIEW IF EXISTS stadium_owner_bookings;
```

### Error: "column does not exist"
**Solution:** Make sure you ran migrations in order. Check which step failed and start from there.

### Error: "permission denied"
**Solution:** Ensure you're logged in as database admin in Supabase dashboard.

---

## ✅ Next Steps After Migration

1. **Test Webhook Handler**
   - The webhook is already deployed at `/api/webhooks/razorpay`
   - Configure Razorpay webhook URL in dashboard

2. **Build Frontend UI**
   - Match creation Step 6 (payment form)
   - Dashboard components for each user role
   - Payout management interface for admins

3. **Test Payment Flow**
   - Create a test match with all costs
   - Complete payment with Razorpay test card
   - Verify bookings are created automatically
   - Check dashboard views populate correctly

---

## 📞 Support

If you encounter issues:
1. Check the error message in Supabase SQL editor
2. Verify you ran migrations in the correct order
3. Check that all prerequisite tables exist (matches, stadiums, teams, clubs, users)
4. Review the SQL files for any schema mismatches

---

**Ready to proceed?** Start with Step 1 and work through each migration sequentially! 🚀
