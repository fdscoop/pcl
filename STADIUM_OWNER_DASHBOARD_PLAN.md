# Stadium Owner Dashboard - Development Plan

## Overview
Complete stadium management system for venue owners to manage their stadiums, bookings, payouts, and KYC verification.

## Current Status
✅ Basic layout exists (`layout.tsx`)
✅ Basic dashboard page exists (`page.tsx`)
⏸️ Missing: Stadiums CRUD, Bookings, Statistics, Payouts, KYC, Settings

## Database Schema (Existing)

### stadiums table
- id, owner_id, stadium_name, slug
- description, location, city, state, country
- capacity, amenities[], hourly_rate
- photo_urls[], is_active
- created_at, updated_at, deleted_at

### stadium_slots table
- id, stadium_id, slot_date, start_time, end_time
- is_available, booked_by (club_id)
- booking_date, created_at, updated_at

## Pages to Build

### 1. `/stadiums` - Stadium Management (CRUD)
**Features:**
- List all stadiums owned by user
- Add new stadium with photo upload
- Edit stadium details
- Manage amenities (checkboxes: parking, wifi, changing rooms, etc.)
- Set hourly rates
- Toggle active/inactive status

**Components:**
- Stadium card grid
- Create/Edit form with image upload (Capacitor Camera ready)
- Delete confirmation dialog

### 2. `/stadiums/[id]` - Stadium Details & Slot Management
**Features:**
- View stadium details
- Calendar view of availability
- Create time slots (date, start time, end time)
- Mark slots as available/unavailable
- View bookings for this stadium
- Quick stats (booking rate, revenue, utilization)

**Components:**
- Calendar component
- Slot creation form
- Booking list

### 3. `/bookings` - Booking Management
**Features:**
- List all bookings (upcoming, past, cancelled)
- Filter by stadium, date range, status
- View booking details (club name, match info, payment status)
- Confirm/reject booking requests
- Download booking report

**Components:**
- Booking cards with status badges
- Filter sidebar
- Booking detail modal

### 4. `/statistics` - Analytics Dashboard
**Features:**
- Revenue chart (monthly/yearly)
- Booking trends graph
- Utilization rate by stadium
- Peak hours heatmap
- Popular amenities analysis
- Club rankings (most frequent bookers)

**Components:**
- Recharts/Chart.js graphs
- Date range picker
- Export to PDF/CSV

### 5. `/payouts` - Payment & Revenue
**Features:**
- Total earnings overview
- Pending payouts
- Completed payouts history
- Payment method setup (bank account, UPI)
- Transaction history
- Payout schedule settings

**Components:**
- Revenue cards
- Payment method form
- Transaction table with pagination

### 6. `/kyc` - KYC Verification
**Features:**
- Upload ownership documents (property papers)
- Aadhaar verification (existing system)
- PAN card upload
- Business registration (if applicable)
- KYC status tracker
- Re-upload rejected documents

**Components:**
- Document upload with preview
- Verification status stepper
- Re-upload functionality

### 7. `/settings` - Account Settings
**Features:**
- Profile management
- Change password
- Notification preferences
- Auto-accept booking settings
- Cancellation policy
- Business hours

**Components:**
- Settings tabs
- Toggle switches
- Form sections

## Technical Implementation

### Phase 1: Core Pages (Week 1)
1. ✅ Layout & Navigation (exists)
2. 🔨 Enhanced Dashboard with real data
3. 🔨 Stadiums list & create
4. 🔨 Stadium details & slot management

### Phase 2: Booking System (Week 2)
5. 🔨 Bookings page with filtering
6. 🔨 Booking confirmation workflow
7. 🔨 Email notifications

### Phase 3: Analytics & Money (Week 3)
8. 🔨 Statistics page with charts
9. 🔨 Payouts page with Cashfree integration
10. 🔨 Transaction history

### Phase 4: Compliance & Polish (Week 4)
11. 🔨 KYC verification flow
12. 🔨 Settings page
13. 🔨 Mobile optimizations
14. 🔨 Testing & bug fixes

## Mobile Strategy (Capacitor)

### Immediate (Web-First)
- Build fully responsive web pages
- Test on mobile browsers
- Ensure touch-friendly UI

### Later (Capacitor Conversion)
**Plugins to add:**
```bash
npm install @capacitor/camera
npm install @capacitor/push-notifications
npm install @capacitor/filesystem
npm install @capacitor/geolocation
```

**Features to enhance:**
1. **Camera** - Take photos of stadium instead of upload
2. **Push Notifications** - New booking alerts
3. **Geolocation** - Auto-fill stadium location
4. **Filesystem** - Save documents locally

### Capacitor Setup (When Ready)
```bash
# Initialize
npx cap init "PCL Stadium" "com.pcl.stadium" --web-dir=apps/web/out

# Add platforms
npx cap add ios
npx cap add android

# Build & sync
npm run build
npx cap sync
npx cap open ios
npx cap open android
```

## Database Migrations Needed

### Add booking status tracking
```sql
ALTER TABLE stadium_slots 
ADD COLUMN booking_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN cancelled_by UUID REFERENCES users(id),
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN cancelled_at TIMESTAMP;
```

### Add payment tracking
```sql
CREATE TABLE stadium_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stadium_owner_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id TEXT,
  payout_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Add KYC documents for stadium owners
```sql
ALTER TABLE users
ADD COLUMN stadium_kyc_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN property_document_url TEXT,
ADD COLUMN pan_card_url TEXT,
ADD COLUMN business_reg_url TEXT;
```

## API Endpoints to Create

### Stadium Management
- `POST /api/stadiums` - Create stadium
- `GET /api/stadiums/:id` - Get stadium details
- `PUT /api/stadiums/:id` - Update stadium
- `DELETE /api/stadiums/:id` - Soft delete stadium
- `POST /api/stadiums/:id/upload-photos` - Upload images

### Slot Management
- `POST /api/stadiums/:id/slots` - Create slot
- `GET /api/stadiums/:id/slots` - List slots
- `PUT /api/slots/:id` - Update slot
- `DELETE /api/slots/:id` - Delete slot

### Bookings
- `GET /api/stadium-owner/bookings` - List all bookings
- `PUT /api/bookings/:id/confirm` - Confirm booking
- `PUT /api/bookings/:id/reject` - Reject booking
- `GET /api/bookings/:id/invoice` - Generate invoice

### Analytics
- `GET /api/stadium-owner/analytics/revenue` - Revenue data
- `GET /api/stadium-owner/analytics/bookings` - Booking trends
- `GET /api/stadium-owner/analytics/utilization` - Utilization rates

## UI/UX Considerations

### Design System
- Reuse club dashboard components
- Stadium-specific color scheme (maybe green/teal instead of blue)
- Icons: Building2, MapPin, Calendar, DollarSign

### Responsive Breakpoints
- Mobile: 320px - 640px
- Tablet: 641px - 1024px
- Desktop: 1025px+

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast mode
- Touch targets 44x44px minimum

## Next Steps

1. **Immediate:**
   - Create stadium CRUD pages
   - Implement slot calendar
   - Build booking management

2. **Short-term:**
   - Add statistics dashboard
   - Integrate payment system
   - KYC verification flow

3. **Long-term:**
   - Capacitor mobile app
   - Push notifications
   - Offline support

---

**Start Date:** 2026-01-06
**Estimated Completion:** 2026-02-03 (4 weeks)
**Mobile Conversion:** TBD (After web MVP is stable)
