# Professional Club League (PCL) Platform

A comprehensive sports management platform for organizing professional club leagues, tournaments, and friendly matches.

## Platform Overview

PCL is a multi-tenant SaaS platform designed to facilitate sports league management with the following key features:

### User Types

1. **Club Owners** - Create and manage clubs (registered or unregistered)
2. **Players** - Create profiles, manage contracts, track performance
3. **Referees** - Create profiles and get assigned to matches
4. **Staff/Volunteers** - Manage match operations
5. **Stadium Owners** - List stadiums, manage availability and pricing

### Key Features

- **Club Management**: Create teams, manage players, organize matches
- **Player Management**: Profile creation, KYC verification, contract management
- **Match Organization**: Support for Friendly matches, 5-a-side, 7-a-side, and 11-a-side
- **Referee & Staff Assignment**: Ensure minimum requirements for official matches
- **Tournament Management**: Friendly, Hobby, and Tournament structures
- **Stadium Booking**: Book stadiums for matches
- **Contract Management**: Handle player contracts, amendments, and terminations

### Match Requirements

| Format | Referees Required | Staff Required |
|--------|-------------------|----------------|
| Friendly/Hobby | 1 | 1 |
| 5-a-side | 1 | 1 |
| 7-a-side | 2 | 2 |
| 11-a-side | 3-5 | 3 |

### League Structure

- **Friendly/Hobby** - For beginners, no ranking
- **Tournament** - Official PCL tournaments
- **Amateur** - Third division
- **Intermediate** - Second division
- **Professional** - First division

*Note: Currently focusing on Friendly and Tournament structures*

## Project Structure

```
pcl/
├── apps/
│   ├── web/                 # Next.js frontend app
│   └── api/                 # API routes
├── packages/
│   ├── db/                  # Database schemas and migrations
│   ├── auth/                # Authentication logic
│   └── types/               # Shared TypeScript types
├── supabase/                # Supabase migrations and config
└── docs/                    # Documentation
```

## Tech Stack

- **Frontend**: Next.js 14+, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Edge Functions
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Database**: PostgreSQL (via Supabase)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables: `cp .env.example .env.local`
4. Run migrations: `npm run db:migrate`
5. Start development: `npm run dev`

## Database Schema

See `/supabase/migrations` for detailed schema documentation.

### Core Tables

- **users** - User accounts
- **clubs** - Club information
- **teams** - Teams within clubs
- **players** - Player profiles
- **contracts** - Player-Club contracts
- **matches** - Match records
- **referees** - Referee profiles
- **staff** - Staff/volunteer profiles
- **stadiums** - Stadium information
- **tournaments** - Tournament data
- **match_assignments** - Referee and staff assignments

## Development Workflow

```bash
# Start all services
npm run dev

# Run linting
npm run lint

# Type checking
npm run type-check

# Build for production
npm run build
```

## Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Vercel (optional for local development)
VERCEL_ENV=development
```

## License

Proprietary - Professional Club League

## Support

For support, contact: support@pcl.platform

## Contributors

Project initiated with comprehensive planning for sports league management.
