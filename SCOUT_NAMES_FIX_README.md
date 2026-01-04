# Scout Players Names - Fix Summary

## Problem
Player names not displaying on `/scout/players` page.

## Root Cause
1. **Query Syntax Error** - Fixed in code ✅
2. **RLS Policy Blocking** - Needs SQL fix 🔧

## Solution

### Code Fix (Already Done ✅)
**File:** `apps/web/src/app/scout/players/page.tsx`  
**Change:** Line 170 - `users:user_id (` → `users (`

### Database Fix (Apply This)
**File:** `FIX_USERS_TABLE_RLS_FOR_SCOUT.sql`

**Steps:**
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
2. Copy SQL from `FIX_USERS_TABLE_RLS_FOR_SCOUT.sql`
3. Paste and run
4. Reload scout page

**Result:** Player names will display ✅

## Data Model
- Players table has `user_id` foreign key → users(id)
- Player names stored in users table (first_name, last_name)
- Query needs to join both tables for complete data

## Security
The RLS policy allows authenticated users to read basic player info (names, bio, email).  
Sensitive data (passwords, tokens) remain protected.

## Files
- `FIX_USERS_TABLE_RLS_FOR_SCOUT.sql` - Ready-to-run SQL
- `SCOUT_NAMES_FIX_QUICK.md` - Quick reference guide