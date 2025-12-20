# Club Creation Feature

## What Was Added

### 1. Club Creation Form Component
**File**: [apps/web/src/components/forms/ClubCreationForm.tsx](apps/web/src/components/forms/ClubCreationForm.tsx)

A comprehensive form for club owners to create their clubs with:
- **Club Name** (Required)
- **Club Type** (Required): Registered or Unregistered
- **Category** (Required): Professional, Semi-Professional, Amateur, Youth Academy, College/University, Corporate
- **Registration Number** (Conditional): Only shown for Registered clubs
- **Founded Year** (Required): 1800 to current year
- **Location** (Required): City, State, Country
- **Contact Info** (Required): Email, Phone
- **Website** (Optional): Must be valid URL
- **Description** (Optional): Free text about the club

Features:
- Form validation with Zod schema
- Conditional fields (registration number only for registered clubs)
- Error handling and display
- Loading states
- Links club to the authenticated user as owner

### 2. Club Creation Page
**File**: [apps/web/src/app/club/create/page.tsx](apps/web/src/app/club/create/page.tsx)

Protected page that:
- Checks user authentication (redirects to login if not authenticated)
- Verifies user has 'club_owner' role (redirects if not)
- Shows the ClubCreationForm component
- Includes PCL logo and consistent navigation

### 3. Dashboard Integration
**Updated**: [apps/web/src/app/dashboard/club-owner/page.tsx](apps/web/src/app/dashboard/club-owner/page.tsx:140-145)

The "Create Club" button now navigates to `/club/create`:
```tsx
<Button
  className="w-full"
  onClick={() => router.push('/club/create')}
>
  Create Club
</Button>
```

### 4. Database Schema
**File**: [CREATE_CLUBS_TABLE.sql](CREATE_CLUBS_TABLE.sql)

SQL script to create the `clubs` table with:
- **Enum Types**: `club_type`, `club_category`
- **Main Fields**: name, type, category, registration, founded year, location, contacts
- **Relationships**: Links to users table via `owner_id` (foreign key)
- **Constraints**: Unique club name per owner, founded year validation
- **Indexes**: For performance on common queries
- **Row Level Security (RLS)**:
  - Club owners can CRUD their own clubs
  - All authenticated users can view active clubs
- **Triggers**: Auto-update `updated_at` timestamp

## Next Steps to Make It Work

### Step 1: Create the Clubs Table

Run the SQL in Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new
2. Copy everything from `CREATE_CLUBS_TABLE.sql`
3. Click "Run"
4. Verify success: Should see "Success. No rows returned"

### Step 2: Test the Flow

1. Log in as a club owner account
2. You'll see your dashboard with a "Create Club" button
3. Click the button
4. Fill in all required fields:
   - Club name
   - Select club type (Registered/Unregistered)
   - Select category
   - If Registered: enter registration number
   - Enter founded year (e.g., 2020)
   - Enter city, state, country
   - Enter email and phone
   - Optionally: website and description
5. Click "Create Club"
6. You'll be redirected back to dashboard

### Step 3: Verify Club Creation

After creating a club, verify in database:

```sql
SELECT
  id,
  club_name,
  club_type,
  category,
  city,
  state,
  owner_id,
  is_active,
  created_at
FROM clubs
ORDER BY created_at DESC;
```

## Club Types

### Registered Clubs
- Officially registered with football associations
- Requires registration number
- Typically professional or semi-professional

### Unregistered Clubs
- Informal or amateur clubs
- No registration number required
- Common for local leagues, corporate teams

## Club Categories

| Category | Description |
|----------|-------------|
| Professional | Full-time professional clubs |
| Semi-Professional | Mix of professional and amateur players |
| Amateur | Non-professional, recreational |
| Youth Academy | Training academies for young players |
| College/University | Educational institution teams |
| Corporate | Company-sponsored teams |

## Form Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| Club Name | ✅ Yes | Min 3 characters |
| Club Type | ✅ Yes | Must select from enum |
| Category | ✅ Yes | Must select from enum |
| Registration Number | ❌ No | Only for Registered clubs |
| Founded Year | ✅ Yes | 1800 to current year, 4 digits |
| City | ✅ Yes | Min 2 characters |
| State | ✅ Yes | Min 2 characters |
| Country | ✅ Yes | Min 2 characters |
| Email | ✅ Yes | Valid email format |
| Phone | ✅ Yes | Min 10 characters |
| Website | ❌ No | Must be valid URL if provided |
| Description | ❌ No | Free text |

## User Flow Diagram

```
Club Owner Dashboard
    ↓
Click "Create Club" button
    ↓
/club/create page
    ↓
Fill form with club details
    ↓
Select club type
    ↓
If Registered: show registration number field
    ↓
Submit form
    ↓
Data saved to clubs table
    ↓
is_active set to true
    ↓
owner_id linked to current user
    ↓
Redirect to Club Owner Dashboard
```

## Database Schema Details

### Clubs Table Structure

```sql
clubs (
  id                 UUID PRIMARY KEY
  club_name          TEXT NOT NULL
  club_type          ENUM ('Registered', 'Unregistered')
  category           ENUM (6 options)
  registration_number TEXT
  founded_year       INTEGER (1800-current)
  city               TEXT NOT NULL
  state              TEXT NOT NULL
  country            TEXT NOT NULL
  email              TEXT NOT NULL
  phone              TEXT NOT NULL
  website            TEXT
  description        TEXT
  logo_url           TEXT
  owner_id           UUID → users(id)
  is_active          BOOLEAN DEFAULT true
  created_at         TIMESTAMPTZ
  updated_at         TIMESTAMPTZ
)
```

### Indexes Created

- `idx_clubs_owner` - Find clubs by owner
- `idx_clubs_type` - Filter by club type
- `idx_clubs_category` - Filter by category
- `idx_clubs_active` - Show only active clubs
- `idx_clubs_location` - Search by location
- `idx_clubs_created_at` - Sort by creation date

### Row Level Security Policies

1. **Club owners can view their own clubs**
   - Ensures owners only see clubs they created

2. **Club owners can insert their own clubs**
   - Allows creating new clubs linked to their user ID

3. **Club owners can update their own clubs**
   - Allows editing club details

4. **Club owners can delete their own clubs**
   - Allows removing clubs they own

5. **Authenticated users can view active clubs**
   - Public browsing for active clubs
   - Used for player scouting, match scheduling, etc.

## Future Enhancements

### 1. Club Dashboard Page
Create `/club/[id]/dashboard` to show:
- Club details and statistics
- Teams under the club
- Player roster
- Match history
- Financial overview

### 2. Club Listing on Dashboard
Update club owner dashboard to:
- Fetch and display user's clubs
- Show club stats (teams count, players count)
- Add "Edit" and "View" buttons for each club

### 3. Club Logo Upload
- Add image upload functionality
- Store in Supabase Storage
- Update `logo_url` field

### 4. Multi-team Support
Create `teams` table:
- Link teams to clubs (one club, multiple teams)
- Different age groups (U-13, U-15, Senior)
- Different formats (5-a-side, 7-a-side, 11-a-side)

### 5. Club Verification
Add verification workflow for registered clubs:
- Upload registration documents
- Admin review process
- Verified badge on profile

### 6. Club Search/Browse
Create public club directory:
- Search by name, location, category
- Filter by club type
- Sort by founded year, popularity

## Files Modified/Created

### New Files
- ✅ `/apps/web/src/components/forms/ClubCreationForm.tsx` (Form component)
- ✅ `/apps/web/src/app/club/create/page.tsx` (Club creation page)
- ✅ `/CREATE_CLUBS_TABLE.sql` (Database migration)
- ✅ `/CLUB_CREATION_IMPLEMENTATION.md` (This documentation)

### Modified Files
- ✅ `/apps/web/src/app/dashboard/club-owner/page.tsx` (Added button navigation, removed unused state)

## Testing Checklist

- [ ] Run database migration SQL
- [ ] Log in as club owner
- [ ] Click "Create Club" button
- [ ] Verify form validation (try submitting empty)
- [ ] Select "Registered" club type
- [ ] Verify registration number field appears
- [ ] Select "Unregistered" club type
- [ ] Verify registration number field disappears
- [ ] Fill all required fields
- [ ] Submit form
- [ ] Verify redirect to dashboard
- [ ] Check database to confirm club created
- [ ] Verify `owner_id` matches logged-in user
- [ ] Try creating club with same name (should work - unique per owner)
- [ ] Log out and log in as different club owner
- [ ] Try creating club with same name (should work - different owner)

## Common Issues

**Issue**: Form submission fails with "relation clubs does not exist"
**Solution**: Make sure you ran the database migration SQL in Supabase

**Issue**: Can't access club creation page (redirects immediately)
**Solution**: Check that user is logged in and has 'club_owner' role

**Issue**: Registration number field not showing
**Solution**: Make sure you selected "Registered" as club type

**Issue**: Error "duplicate key value violates unique constraint"
**Solution**: You already have a club with this exact name. Choose a different name.

**Issue**: Website validation fails
**Solution**: Website must include protocol (https:// or http://). If you don't have a website, leave it blank.

**Issue**: Founded year validation fails
**Solution**: Year must be between 1800 and current year (2025), and exactly 4 digits.

## Security Considerations

### Row Level Security (RLS)
All database operations are protected by RLS policies:
- Users can only create clubs linked to their own account
- Users can only edit/delete their own clubs
- Other users can only view active clubs (not edit/delete)

### Form Validation
Both client-side (Zod) and database-side (CHECK constraints) validation:
- Prevents invalid data entry
- Ensures data integrity
- Provides clear error messages

### Authentication Checks
Page-level authentication:
- Redirects to login if not authenticated
- Verifies user role before showing form
- Backend validates user ID before inserting

## API Endpoints Used

The form interacts with Supabase REST API:

**Create Club**:
```typescript
POST /rest/v1/clubs
Body: { club_name, club_type, category, ... }
Headers: { Authorization: Bearer <jwt_token> }
```

RLS automatically filters based on authenticated user.
