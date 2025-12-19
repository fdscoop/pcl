# PCL - Optimized UI Implementation Guide

## ✅ What's Been Implemented

### 1. **Authentication System**
- **Location**: `/src/app/auth/page.tsx`
- **Features**:
  - Role selection screen (5 user types)
  - Sign in / Sign up toggle
  - Clean gradient UI with card-based layout
  - Email/password form

### 2. **Comprehensive Signup Flow**
- **Location**: `/src/app/signup/page.tsx`
- **Features**:
  - Tabbed interface for all 5 user types
  - Individual forms with role-specific fields
  - Real-time validation with Zod
  - React Hook Form integration

#### Signup Forms Created:
1. **PlayerSignupForm** (`/src/components/forms/PlayerSignupForm.tsx`)
   - Fields: firstName, lastName, email, phone, position, dateOfBirth, height, weight
   - Position selection dropdown
   - Organized in sections

2. **ClubSignupForm** (`/src/components/forms/ClubSignupForm.tsx`)
   - Fields: clubName, registrationNumber, email, phone, city, state, foundedYear, clubColor
   - Color picker for club branding
   - Organized in sections

3. **RefereeSignupForm** (`/src/components/forms/RefereeSignupForm.tsx`)
   - Fields: firstName, lastName, email, phone, licenseNumber, experience, certifications, matchTypesOfficiate
   - Experience level dropdown
   - Professional certification tracking

4. **StadiumSignupForm** (`/src/components/forms/StadiumSignupForm.tsx`)
   - Fields: contactName, email, phone, stadiumName, capacity, location, city, state
   - Capacity input validation
   - Location details

5. **StaffSignupForm** (`/src/components/forms/StaffSignupForm.tsx`)
   - Fields: firstName, lastName, email, phone, role, associatedClub, availability, specializations
   - Role dropdown (Coach, Trainer, Medic, Manager, Volunteer, Coordinator)
   - Availability selection (Full Time, Part Time, Weekends, Flexible)

### 3. **Dashboard Systems (5 User Types)**

#### Player Dashboard
- **Location**: `/src/app/dashboard/player/page.tsx`
- **Features**:
  - Matches Played, Goals Scored, Active Contracts, Rating stats
  - Upcoming matches list
  - Recent performance (W/L/D)
  - Current club information
  - Quick action buttons

#### Club Dashboard
- **Location**: `/src/app/dashboard/club/page.tsx`
- **Features**:
  - Total Players, Matches This Season, Win Rate, League Position stats
  - Upcoming matches management
  - Player roster with edit/view options
  - Season summary with progress bars
  - Management actions (staff, contracts, finances)

#### Referee Dashboard
- **Location**: `/src/app/dashboard/referee/page.tsx`
- **Features**:
  - Matches Officiated, This Season, Average Rating, License Status stats
  - Upcoming assignments with accept/details buttons
  - Recent match records with reports
  - License information display
  - Quick actions (statistics, request match, file report)

#### Stadium Dashboard
- **Location**: `/src/app/dashboard/stadium/page.tsx`
- **Features**:
  - Total Capacity, Monthly Bookings, Occupancy Rate, Monthly Revenue stats
  - Upcoming bookings management
  - Maintenance schedule tracking
  - Facility details display
  - Analytics and financial reporting

#### Staff Dashboard
- **Location**: `/src/app/dashboard/staff/page.tsx`
- **Features**:
  - Role, Hours This Month, Tasks Assigned, Team stats
  - Task list with priority levels (High/Medium/Low)
  - Upcoming events calendar
  - Employment information
  - Quick actions (time off request, submit report)

### 4. **UI Components**

#### Base Components
- **Button** (`/src/components/ui/button.tsx`)
  - Variants: default, destructive, outline, secondary, ghost, link
  - Sizes: default, sm, lg, icon
  
- **Input** (`/src/components/ui/input.tsx`)
  - Multiple input types: text, email, password, number, date, color, file
  
- **Card** (`/src/components/ui/card.tsx`)
  - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
  
- **Form** (`/src/components/ui/form.tsx`)
  - React Hook Form integration with Zod validation
  - FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage
  
- **Tabs** (`/src/components/ui/tabs.tsx`)
  - Radix UI tabs for multi-page experiences
  - TabsList, TabsTrigger, TabsContent

#### Navigation Component
- **DashboardNav** (`/src/components/navigation/DashboardNav.tsx`)
  - Role-specific navigation
  - Active page highlighting
  - Icon-based navigation items
  - Settings/Sign out buttons

### 5. **Pages & Routes**

**Public Pages:**
- `/` - Home page with hero, features, CTA buttons
- `/auth` - Authentication with role selection
- `/signup` - Multi-user signup with tabs

**Dashboard Routes (Role-Based):**
- `/dashboard/player` - Player dashboard
- `/dashboard/club` - Club dashboard
- `/dashboard/referee` - Referee dashboard
- `/dashboard/stadium` - Stadium dashboard
- `/dashboard/staff` - Staff dashboard

### 6. **Design System**

#### Colors & Styling
- **Tailwind CSS** 4.1.18 with custom CSS variables
- **Gradient Backgrounds**: Blue → Indigo for modern look
- **Card-Based Layout**: Clean, modern UI with shadows and borders
- **Responsive Design**: Mobile-first approach with md/lg breakpoints

#### Dark Mode Support
- CSS variables configured for dark mode
- Ready for theme switching

#### Typography
- System fonts for performance
- Semantic heading hierarchy
- Clear visual hierarchy with font weights

### 7. **Form Validation**

**Zod Schemas Implemented:**
- PlayerSignupSchema
- ClubSignupSchema
- RefereeSignupSchema
- StadiumSignupSchema
- StaffSignupSchema

**Validation Features:**
- Real-time validation with `mode: 'onChange'`
- Email validation
- Phone number regex validation
- Required field validation
- Min/max length validation

## 🚀 Getting Started

### Access the Application
Development server running at: **http://localhost:3000**

### Navigate to Pages
1. **Home**: http://localhost:3000/
2. **Sign In/Role Selection**: http://localhost:3000/auth
3. **Sign Up**: http://localhost:3000/signup
4. **Dashboards**:
   - Player: http://localhost:3000/dashboard/player
   - Club: http://localhost:3000/dashboard/club
   - Referee: http://localhost:3000/dashboard/referee
   - Stadium: http://localhost:3000/dashboard/stadium
   - Staff: http://localhost:3000/dashboard/staff

## 📋 Form Implementation Details

### All forms include:
✅ Section-based organization
✅ Real-time validation with error messages
✅ Organized grid layouts
✅ Responsive design
✅ Clear labels and placeholders
✅ Submit buttons with loading state ready
✅ Form submission handlers (ready for Supabase integration)

### Current Status
- Forms have skeleton implementations for Supabase integration
- All handlers have `console.log('Form submitted:', data)` comments
- Ready to connect to Supabase auth and database

## 🔗 Next Steps

### To Connect to Supabase:
1. Import Supabase client from `/src/lib/supabase/client.ts`
2. In each form's `onSubmit` handler, call Supabase auth
3. Store user data in corresponding table (players, clubs, referees, stadiums, staff)

### Example Pattern (Ready in all forms):
```typescript
const onSubmit = async (data: FormData) => {
  // TODO: Connect to Supabase
  // 1. Call supabase.auth.signUp()
  // 2. Create user record in database
  // 3. Redirect to dashboard
}
```

### To Implement Role-Based Routing:
1. Add middleware to check user role from Supabase session
2. Redirect to appropriate dashboard after login
3. Protect routes with middleware

### To Add Dashboard Features:
1. Replace mock data with API calls
2. Fetch data from Supabase real-time subscriptions
3. Add CRUD operations for each resource
4. Implement filtering, sorting, pagination

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx (home)
│   ├── auth/
│   │   └── page.tsx (role selection)
│   ├── signup/
│   │   └── page.tsx (5 signup forms)
│   ├── dashboard/
│   │   ├── player/
│   │   │   └── page.tsx
│   │   ├── club/
│   │   │   └── page.tsx
│   │   ├── referee/
│   │   │   └── page.tsx
│   │   ├── stadium/
│   │   │   └── page.tsx
│   │   └── staff/
│   │       └── page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── tabs.tsx
│   ├── forms/
│   │   ├── PlayerSignupForm.tsx
│   │   ├── ClubSignupForm.tsx
│   │   ├── RefereeSignupForm.tsx
│   │   ├── StadiumSignupForm.tsx
│   │   └── StaffSignupForm.tsx
│   └── navigation/
│       └── DashboardNav.tsx
├── lib/
│   ├── utils.ts (cn() utility)
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── styles/
    └── globals.css
```

## 🎨 UI Features Implemented

- ✅ Gradient backgrounds
- ✅ Card-based layouts
- ✅ Tab navigation
- ✅ Form validation with real-time feedback
- ✅ Icon-based navigation
- ✅ Stats cards with metrics
- ✅ Progress bars
- ✅ Status badges
- ✅ Action buttons
- ✅ Responsive grid layouts
- ✅ Dark mode CSS variables ready

## ⚙️ Technologies Used

- **Next.js 14.2.35** - React framework
- **React 18.2** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4.1.18** - Styling
- **React Hook Form 7.68.0** - Form management
- **Zod 4.2.1** - Schema validation
- **Radix UI** - Unstyled accessible components
- **Supabase** - Backend (configured, ready for integration)

## 📞 Support

For any issues or questions about the implementation:
1. Check the component examples in `/src/components/`
2. Review form patterns in `/src/components/forms/`
3. Examine dashboard layouts in `/src/app/dashboard/`
