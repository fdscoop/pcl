# PCL Architecture Documentation

## System Overview

The Professional Club League (PCL) is a modern SaaS platform built with a monorepo structure using:
- **Frontend**: Next.js 14+ with React 18
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Deployment**: Vercel
- **Package Manager**: npm with Turbo for monorepo management

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Users (Browser)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │
┌────────────────────────┴────────────────────────────────────┐
│                      Vercel CDN                              │
│         (Next.js Frontend + API Routes)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Web App (apps/web)                                   │   │
│  │ - Pages & Layouts                                    │   │
│  │ - React Components                                   │   │
│  │ - Client/Server Logic                               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Routes (src/app/api)                             │   │
│  │ - Authentication                                     │   │
│  │ - Data Management                                    │   │
│  │ - Business Logic                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS (PostgREST)
                         │
┌────────────────────────┴────────────────────────────────────┐
│                     Supabase Backend                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PostgreSQL Database                                  │   │
│  │ - Users & Authentication                            │   │
│  │ - Clubs, Teams, Players                             │   │
│  │ - Contracts & Amendments                            │   │
│  │ - Matches & Tournaments                             │   │
│  │ - Stadiums & Bookings                               │   │
│  │ - Staff & Referees                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Authentication (Supabase Auth)                       │   │
│  │ - Email/Password Auth                               │   │
│  │ - Session Management                                │   │
│  │ - JWT Tokens                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Edge Functions (Optional)                            │   │
│  │ - Real-time Notifications                           │   │
│  │ - Scheduled Jobs                                    │   │
│  │ - File Processing                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Storage (Supabase Storage)                           │   │
│  │ - Profile Photos                                    │   │
│  │ - Stadium Images                                    │   │
│  │ - Match Videos                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
pcl/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/           # Next.js 14 app directory
│   │   │   ├── components/    # Reusable React components
│   │   │   ├── lib/           # Utilities (Supabase, hooks)
│   │   │   └── types/         # TypeScript definitions
│   │   ├── public/            # Static assets
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── tsconfig.json
│   │
│   └── api/                    # API Server (future expansion)
│       └── ...
│
├── packages/
│   ├── db/                     # Database utilities
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth/                   # Authentication utilities
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── types/                  # Shared TypeScript types
│       ├── src/
│       └── package.json
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # Core schema
│   │   └── 002_seed_data.sql         # Initial data
│   ├── functions/              # Edge functions
│   ├── config.toml            # Supabase config
│   └── config.py              # Python config
│
├── docs/
│   ├── DATABASE_SCHEMA.md      # Database documentation
│   ├── ARCHITECTURE.md         # This file
│   ├── API_SPEC.md            # API specifications
│   ├── USER_ROLES.md          # User roles & permissions
│   └── DEPLOYMENT.md          # Deployment guide
│
├── package.json               # Monorepo root
├── turbo.json                # Turbo config
├── tsconfig.json             # Root TypeScript config
├── .gitignore
├── .env.example
└── README.md
```

## User Types & Roles

### 1. Player
- **Profile Creation**: Create personal profile with stats
- **KYC Verification**: Required for visibility to scouts
- **Contract Management**: Sign, view, amend, terminate contracts
- **Performance Tracking**: Track matches, goals, assists
- **Availability**: Mark availability for scouting

### 2. Club Owner
- **Club Management**: Create and manage clubs
- **Registration**: Register club with PCL (optional)
- **Team Management**: Create teams within club
- **Player Management**: Scout and sign players via contracts
- **Match Organization**: Schedule matches, tournaments
- **Challenge System**: Challenge other clubs/teams
- **Stadium Booking**: Book stadiums for matches

### 3. Referee
- **Profile Creation**: Create referee profile with certification
- **Match Assignment**: Get assigned to matches based on availability
- **Experience Tracking**: Track matches officiated

### 4. Staff/Volunteers
- **Profile Creation**: Create staff profile with specialization
- **Match Assignment**: Get assigned to matches as organizers
- **Experience Tracking**: Track events organized

### 5. Stadium Owner
- **Stadium Listing**: List stadium with details
- **Slot Management**: Create and manage booking slots
- **Pricing**: Set hourly rates
- **Calendar Management**: Manage availability

## Data Flow

### Player Registration Flow
1. User signs up with email/password
2. Sets role to "player"
3. Creates player profile with stats
4. Completes KYC verification (pending → verified)
5. Becomes available for scouting
6. Receives contract offers from clubs
7. Contract activated when accepted

### Club & Team Creation Flow
1. Club owner signs up
2. Creates club (registered or unregistered)
3. Creates teams within club
4. Searches and scouts players
5. Sends contract offers
6. Manages teams and contracts

### Match Organization Flow
1. Club creates match/tournament
2. Assigns stadium (books slot)
3. Invites/challenges opposing team
4. Assigns referees and staff
5. Validates minimum requirements met
6. Conducts match
7. Records match events and results

## Authentication & Authorization

### Authentication Methods
- **Supabase Auth**: Email/password authentication
- **Session Management**: JWT tokens stored in secure HTTP-only cookies
- **State Persistence**: Auto-refresh tokens on page load

### Authorization Levels
- **Public Routes**: Landing page, documentation
- **Authenticated Routes**: All user features
- **Role-Based Routes**: Club management (club_owner), player management, etc.

## Data Security

1. **Encryption**: All data in transit uses HTTPS
2. **Authentication**: JWT-based session tokens
3. **Authorization**: Row-level security (RLS) policies via Supabase
4. **Soft Deletes**: No hard data deletion
5. **Audit Trail**: All changes tracked with timestamps

## API Design

### Next.js API Routes
- Location: `apps/web/src/app/api`
- Pattern: RESTful endpoints
- Authentication: Via Supabase session
- Response Format: JSON

### Example Endpoints
```
GET    /api/user              # Get current user
POST   /api/auth/signup       # User registration
POST   /api/auth/login        # User login
GET    /api/clubs             # List clubs
POST   /api/clubs             # Create club
GET    /api/players           # List available players
POST   /api/contracts         # Create contract offer
GET    /api/matches           # List matches
POST   /api/matches           # Schedule match
```

## Database Design Principles

1. **Normalization**: 3NF design to minimize redundancy
2. **Referential Integrity**: Foreign keys enforce relationships
3. **Unique Constraints**: Prevent duplicate data
4. **Indexes**: Optimize query performance
5. **Soft Deletes**: `deleted_at` for data retention
6. **Timestamps**: `created_at`, `updated_at` for audit
7. **Enums**: Type safety for status fields

## Performance Optimization

### Database
- Indexed columns for common filters
- Efficient joins with foreign keys
- Connection pooling via Supabase
- Query optimization for reports

### Frontend
- Server-side rendering (SSR) for initial load
- Static site generation (SSG) where applicable
- Client-side caching with React Query (future)
- Image optimization with Next.js Image component
- Code splitting and lazy loading

### Deployment
- CDN distribution via Vercel
- Edge caching for static assets
- Database connection optimization
- Real-time capabilities via Supabase

## Scalability Considerations

1. **Monorepo Structure**: Separate concerns, easier scaling
2. **Serverless Functions**: Auto-scaling API routes
3. **Database Connection Pooling**: Managed by Supabase
4. **Static Asset CDN**: Vercel's global edge network
5. **Real-time Features**: Supabase subscriptions (future)

## Future Enhancements

1. **Mobile Apps**: React Native for iOS/Android
2. **Real-time Features**: WebSocket updates for live matches
3. **Analytics Dashboard**: Performance insights and statistics
4. **Payment Integration**: Ticket sales, entry fees
5. **Video Integration**: Match replays and highlights
6. **AI/ML Features**: Player recommendations, talent scouting
7. **Social Features**: Messaging, notifications
8. **Admin Panel**: Moderation and platform management

## Development Workflow

### Local Development
1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env.local` with Supabase credentials
4. Run Supabase locally: `supabase start`
5. Start dev server: `npm run dev`

### Testing
- Unit tests for utilities and hooks
- Integration tests for API routes
- E2E tests for user flows (future)

### Deployment
1. Push to GitHub (monitored by Vercel)
2. Vercel automatically builds and deploys
3. Database migrations applied manually
4. Environment variables configured in Vercel dashboard

## Monitoring & Logging

- **Vercel Analytics**: Performance monitoring
- **Supabase Logs**: Database query logs
- **Error Tracking**: Integration with error monitoring (future)
- **User Analytics**: Event tracking (future)

## Compliance & Privacy

- **GDPR**: Data export and deletion capabilities
- **KYC Verification**: Combat identity fraud
- **Data Retention**: Soft deletes maintain data history
- **Access Control**: Role-based permissions

## Contact & Support

For architecture questions or improvements, refer to project documentation or contact the development team.
