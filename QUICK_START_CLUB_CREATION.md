# Quick Start: Club Creation Feature

## What's Ready

✅ Club creation form with full validation
✅ Club creation page at `/club/create`
✅ Dashboard button linked to create club page
✅ Protected route (only club owners can access)
✅ Automatic redirect after club creation
✅ Row Level Security for data protection

## Before You Test

### Run This SQL in Supabase

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new
2. Copy everything from `CREATE_CLUBS_TABLE.sql`
3. Click "Run"
4. You should see: **"Success. No rows returned"**

## How to Test

1. **Create a club owner account** (or log in as one)
2. You'll see your dashboard with a **"Create Club"** button
3. **Click** the button
4. **Fill in** the form:
   - Club name (e.g., "Mumbai City FC")
   - Club type: Registered or Unregistered
   - Category: Professional, Amateur, etc.
   - If Registered: registration number
   - Founded year (e.g., 2020)
   - City, State, Country
   - Email and phone
   - Website (optional)
   - Description (optional)
5. **Click "Create Club"**
6. You'll be redirected back to the dashboard

## Form Fields

| Field | Required | Example |
|-------|----------|---------|
| Club Name | ✅ Yes | Mumbai City FC |
| Club Type | ✅ Yes | Registered |
| Category | ✅ Yes | Professional |
| Registration Number | 📝 If Registered | REG-2020-12345 |
| Founded Year | ✅ Yes | 2020 |
| City | ✅ Yes | Mumbai |
| State | ✅ Yes | Maharashtra |
| Country | ✅ Yes | India |
| Email | ✅ Yes | contact@mumbaifc.com |
| Phone | ✅ Yes | +91 9876543210 |
| Website | ❌ No | https://mumbaifc.com |
| Description | ❌ No | Founded in 2020... |

## Club Types

### Registered
- Officially registered with football associations
- **Must provide** registration number
- Common for professional/semi-professional clubs

### Unregistered
- Informal or amateur clubs
- **No registration number** needed
- Common for local leagues, corporate teams

## Club Categories

Choose what best describes your club:
- **Professional** - Full-time professional club
- **Semi-Professional** - Mix of pro and amateur players
- **Amateur** - Recreational, non-professional
- **Youth Academy** - Training academy for young players
- **College/University** - Educational institution team
- **Corporate** - Company-sponsored team

## Verify It Worked

Run this in Supabase SQL Editor:

```sql
SELECT
  club_name,
  club_type,
  category,
  city,
  state,
  owner_id,
  created_at
FROM clubs
ORDER BY created_at DESC;
```

You should see your newly created club!

## File Locations

```
Club Creation Feature Files:
├── apps/web/src/
│   ├── components/forms/
│   │   └── ClubCreationForm.tsx          (Form component)
│   ├── app/
│   │   ├── club/create/
│   │   │   └── page.tsx                   (Creation page)
│   │   └── dashboard/club-owner/
│   │       └── page.tsx                   (Updated dashboard)
│
Documentation:
├── CREATE_CLUBS_TABLE.sql                 (Run this first!)
├── CLUB_CREATION_IMPLEMENTATION.md        (Full documentation)
└── QUICK_START_CLUB_CREATION.md           (This file)
```

## What Happens Behind the Scenes

1. Form validates your input (Zod schema)
2. Checks authentication and user role
3. Creates club record in `clubs` table
4. Links club to your user ID as `owner_id`
5. Sets `is_active = true`
6. Timestamps are auto-generated
7. Redirects you to dashboard

## Key Features

### Smart Form
- Registration number field only shows for Registered clubs
- Year validation (1800 to 2025)
- Email and URL format validation
- All validation happens before submission

### Security
- Only club owners can create clubs
- Clubs are automatically linked to your account
- You can only edit/delete your own clubs
- Other users can view but not modify your clubs

### Data Integrity
- Unique club name per owner (you can't create two clubs with same name)
- Founded year must be valid (1800-2025)
- All required fields enforced
- Automatic timestamps

## Next Steps After This Works

1. **Display clubs on dashboard** - Show list of your clubs
2. **Club details page** - View/edit club information
3. **Add club logo** - Upload club badge/logo
4. **Create teams** - Add multiple teams under a club
5. **Scout players** - Browse and invite players

## Troubleshooting

**Error: "relation clubs does not exist"**
→ Run the SQL migration from `CREATE_CLUBS_TABLE.sql`

**Can't access /club/create page**
→ Make sure you're logged in as a club owner (not player, referee, etc.)

**Registration number field not showing**
→ Select "Registered" as club type first

**Error: "duplicate key value"**
→ You already have a club with this name, choose a different name

**Website validation fails**
→ Include https:// or http:// in the URL, or leave it blank

**Founded year won't accept my input**
→ Must be exactly 4 digits between 1800 and 2025

## Example: Creating a Professional Club

```
Club Name: Mumbai Strikers FC
Club Type: Registered
Category: Professional
Registration Number: MH-FC-2020-001
Founded Year: 2020
City: Mumbai
State: Maharashtra
Country: India
Email: info@mumbaistrikers.com
Phone: +91 22 12345678
Website: https://mumbaistrikers.com
Description: Professional football club based in Mumbai,
             competing in regional leagues since 2020.
```

Click "Create Club" and you're done! ✅

## Ready to Test?

1. ✅ Run `CREATE_CLUBS_TABLE.sql` in Supabase
2. ✅ Refresh your dev server (if needed)
3. ✅ Go to http://localhost:3000
4. ✅ Log in as club owner
5. ✅ Click "Create Club"
6. ✅ Fill and submit!

Your club is now created! 🎉
