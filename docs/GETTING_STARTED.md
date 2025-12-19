# PCL Getting Started Guide

## Quick Start

Get the Professional Club League platform up and running in 5 minutes.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher (comes with Node.js)
- **Git**: For cloning the repository
- **Code Editor**: VS Code recommended
- **Supabase Account**: Free tier available at https://supabase.com
- **Vercel Account**: Free tier available at https://vercel.com

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/pcl.git
cd pcl

# Install dependencies
npm install
```

### Step 2: Set Up Supabase Locally (Optional)

For local development without Supabase cloud account:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# This will provide local database URL and keys
```

### Step 3: Configure Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# For server-side operations only (never expose client-side)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these values:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the URL and keys

### Step 4: Run Database Migrations

```bash
# Option A: Using Supabase CLI (if using local Supabase)
supabase db push

# Option B: Manual setup in Supabase dashboard
# 1. Go to SQL Editor
# 2. Execute /supabase/migrations/001_initial_schema.sql
# 3. Execute /supabase/migrations/002_seed_data.sql
```

### Step 5: Start Development Server

```bash
# Start all services (web app)
npm run dev

# Or start individual apps
cd apps/web
npm run dev

# App will be available at http://localhost:3000
```

## Project Structure Overview

```
pcl/
├── apps/web/              # Next.js frontend application
├── packages/              # Shared libraries
├── supabase/              # Database migrations
├── docs/                  # Documentation
└── package.json           # Monorepo root
```

## Understanding the Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 14 + React 18 | Web application UI |
| Backend | Supabase (PostgreSQL) | Database & authentication |
| Deployment | Vercel | Hosting & CDN |
| Monorepo | Turborepo | Manage multiple packages |

### How It Works

1. **User visits PCL website** (Vercel)
2. **Authenticates** via Supabase Auth
3. **Browser fetches data** from Supabase API
4. **Next.js renders pages** and serves API routes
5. **All data stored** in PostgreSQL database

## Creating Your First User Account

### From Browser

1. Start development server: `npm run dev`
2. Open http://localhost:3000
3. Look for "Sign Up" button
4. Enter email and password
5. Verify email (if using real Supabase)
6. Complete profile setup
7. Choose user role

### Programmatically (For Testing)

```typescript
// apps/web/src/app/api/auth/signup.ts
const { data, error } = await supabase.auth.signUp({
  email: 'player@example.com',
  password: 'SecurePassword123!'
});
```

## Database Tables Quick Reference

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User accounts | id, email, role, kyc_status |
| `players` | Player profiles | user_id, unique_player_id, position |
| `clubs` | Club information | owner_id, club_name, registration_status |
| `teams` | Teams within clubs | club_id, team_name, formation |
| `contracts` | Player-Club contracts | player_id, club_id, status |
| `matches` | Match records | home_team_id, away_team_id, status |
| `stadiums` | Stadium listings | owner_id, stadium_name, hourly_rate |
| `tournaments` | Tournament info | organizer_id, match_format, status |

See `/docs/DATABASE_SCHEMA.md` for complete schema documentation.

## Available npm Scripts

```bash
# Development
npm run dev              # Start all services

# Building
npm run build            # Build for production
npm run type-check       # Check TypeScript types

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Database
npm run db:push          # Run migrations
npm run db:reset         # Reset database
```

## User Roles & Getting Started

### For Players
1. Sign up with email/password
2. Create player profile
3. Submit KYC verification
4. Once verified → Visible to clubs
5. Receive and manage contract offers

### For Club Owners
1. Sign up with email/password
2. Create club (registered or unregistered)
3. Create teams
4. Scout available players
5. Send contract offers
6. Organize matches and tournaments

### For Referees
1. Sign up with email/password
2. Create referee profile
3. Update availability
4. Accept match assignments
5. Officiate matches

### For Stadium Owners
1. Sign up with email/password
2. List stadium with details
3. Create booking slots
4. Set pricing
5. Manage bookings

See `/docs/USER_ROLES.md` for detailed permissions.

## Common Development Tasks

### Adding a New Page

```bash
# Create new page in Next.js app directory
# pages/your-page/page.tsx

import React from 'react';

export default function YourPage() {
  return <div>Your content</div>;
}
```

### Creating a Database Query

```typescript
// Use Supabase client
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase
  .from('players')
  .select('*')
  .eq('current_club_id', clubId);
```

### Adding an API Route

```typescript
// apps/web/src/app/api/example/route.ts

export async function GET(request: Request) {
  // Your logic here
  return new Response(JSON.stringify({ message: 'Hello' }));
}
```

## Testing the Application

### Manual Testing Checklist

- [ ] User signup works
- [ ] User login/logout works
- [ ] Profile creation completes
- [ ] Database saves data
- [ ] Pages load without errors
- [ ] Forms validate input
- [ ] Navigation works

### Viewing Database Data

1. Go to Supabase Dashboard
2. Select your project
3. Go to Table Editor
4. Select any table to view data
5. Insert/edit test data directly

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Database Connection Error

```
Error: Cannot connect to Supabase
```

**Solutions:**
1. Verify `.env.local` has correct URL and keys
2. Check Supabase project is active
3. Ensure internet connection
4. Try restarting development server

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check for type errors
npm run type-check

# Rebuild TypeScript
npm run build
```

## Next Steps

1. **Read the full documentation**:
   - `/docs/DATABASE_SCHEMA.md` - Database structure
   - `/docs/ARCHITECTURE.md` - System design
   - `/docs/USER_ROLES.md` - Roles and permissions

2. **Implement features**:
   - Start with authentication
   - Build player profiles
   - Create club management
   - Add match scheduling

3. **Deploy to production**:
   - Follow `/docs/DEPLOYMENT.md`
   - Set up Supabase project
   - Configure Vercel deployment
   - Custom domain setup

4. **Extend functionality**:
   - Add real-time features
   - Implement notifications
   - Create admin dashboard
   - Build mobile apps

## Project Statistics

- **Database Tables**: 20+
- **User Roles**: 5
- **Match Formats**: 4
- **Tournament Structures**: 3

## Support & Community

- **Documentation**: See `/docs` folder
- **Issues**: Report via GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@pcl.platform

## Tips for Success

### Development Best Practices
1. **Use TypeScript** - Catch errors early
2. **Follow naming conventions** - Consistency matters
3. **Write tests** - Ensure reliability
4. **Comment complex code** - Help future developers
5. **Keep components small** - Easier to maintain

### Database Best Practices
1. **Use migrations** - Manage schema changes
2. **Index frequently queried fields** - Improve performance
3. **Validate data** - Use constraints
4. **Regular backups** - Protect your data
5. **Document schema** - Keep docs updated

### Security Best Practices
1. **Never expose secrets** - Keep keys in `.env.local`
2. **Validate inputs** - Prevent injection attacks
3. **Use HTTPS** - Encrypt all communications
4. **Update dependencies** - Patch vulnerabilities
5. **Follow OWASP** - Security guidelines

## Common Questions

**Q: Can I run the database locally?**
A: Yes! Use `supabase start` to run PostgreSQL locally.

**Q: How do I deploy to production?**
A: Push to GitHub and connect to Vercel. See DEPLOYMENT.md.

**Q: Can I use other databases?**
A: Supabase uses PostgreSQL. You could migrate, but Supabase integration is built-in.

**Q: How do I add more users/roles?**
A: Modify `user_role` enum in database migrations.

**Q: Is there a mobile app?**
A: Not yet, but Next.js can be PWA-enabled. React Native apps are future plans.

## File Structure Explanation

```
pcl/
├── README.md                 # Project overview
├── package.json              # Monorepo dependencies
├── turbo.json               # Turborepo configuration
├── tsconfig.json            # TypeScript config
│
├── apps/
│   └── web/                 # Main Next.js application
│       ├── src/
│       │   ├── app/        # Next.js app directory (pages)
│       │   ├── components/ # React components
│       │   ├── lib/        # Utilities (Supabase, hooks)
│       │   └── types/      # TypeScript definitions
│       ├── public/         # Static files
│       └── package.json
│
├── packages/
│   ├── db/                 # Database utilities (future)
│   ├── auth/               # Auth utilities (future)
│   └── types/              # Shared types (future)
│
├── supabase/
│   ├── migrations/         # SQL migration files
│   ├── functions/          # Edge functions (future)
│   └── config.toml        # Supabase config
│
└── docs/
    ├── DATABASE_SCHEMA.md  # Database documentation
    ├── ARCHITECTURE.md     # System architecture
    ├── USER_ROLES.md      # Roles and permissions
    ├── DEPLOYMENT.md      # Deployment guide
    └── GETTING_STARTED.md # This file
```

## What's Next?

You're now ready to:
1. ✅ Understand the project structure
2. ✅ Set up local development
3. ✅ Explore the database schema
4. ✅ Start building features

Begin by reading the other documentation files and exploring the codebase!

---

**Happy coding! 🚀**

For questions or issues, check the documentation or open a GitHub issue.
