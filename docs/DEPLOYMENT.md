# PCL Deployment Guide

## Overview

This guide covers deploying the PCL platform to production using Vercel for the frontend and Supabase for the backend.

## Prerequisites

- GitHub account and repository
- Supabase account (https://supabase.com)
- Vercel account (https://vercel.com)
- Node.js 18+ installed locally
- Git installed and configured

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Enter project details:
   - **Name**: PCL Production (or your preference)
   - **Database Password**: Generate strong password (save securely)
   - **Region**: Choose closest to your users
4. Wait for project to initialize (~5 minutes)

### 1.2 Run Database Migrations

1. Go to Supabase dashboard → SQL Editor
2. Create new query
3. Copy contents of `/supabase/migrations/001_initial_schema.sql`
4. Execute query to create schema
5. Repeat for `/supabase/migrations/002_seed_data.sql`

Alternatively, use Supabase CLI:

```bash
# Install CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 1.3 Configure Supabase Settings

#### Authentication
1. Go to Authentication → Providers
2. Enable Email (default)
3. Optional: Enable OAuth providers (Google, GitHub, etc.)
4. Set redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

#### Database
1. Go to Database → Public Schema
2. Verify all tables created
3. Check indexes are present
4. Optional: Enable Point in Time Recovery (PITR)

#### Storage (for file uploads)
1. Go to Storage
2. Create bucket "profiles" (for profile photos)
3. Create bucket "stadiums" (for stadium photos)
4. Create bucket "matches" (for match videos)
5. Configure CORS settings

#### API Keys
1. Go to Project Settings → API
2. Copy `Project URL` (save for .env)
3. Copy `anon key` (safe to expose)
4. Copy `service_role key` (keep secret)

### 1.4 Get Connection Information

From Supabase dashboard, collect:
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key

## Step 2: Configure GitHub Repository

### 2.1 Prepare Repository

```bash
# Ensure .gitignore is set up
# Verify sensitive files are not tracked
git status

# Create GitHub repository
# Push code to GitHub
git push origin main
```

### 2.2 Environment Variables

Create `.env.local` for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Never commit `.env.local` to Git**

## Step 3: Deploy to Vercel

### 3.1 Import Project to Vercel

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Search for your PCL repository
4. Click "Import"

### 3.2 Configure Project Settings

#### Environment Variables
1. Under "Environment Variables", add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here (production only)
```

2. For each variable, select which environments:
   - `NEXT_PUBLIC_*`: All environments (Preview, Production, Development)
   - `SUPABASE_SERVICE_ROLE_KEY`: Production only

#### Build Settings
1. Framework Preset: Next.js
2. Root Directory: `./apps/web` (if deploying web app only)
3. Build Command: `npm run build`
4. Output Directory: `.next`
5. Install Command: `npm install`

### 3.3 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Vercel provides preview URL
4. Promote to production when ready

### 3.4 Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration steps
4. Update Supabase redirect URLs

## Step 4: Post-Deployment Setup

### 4.1 Verify Deployment

1. Visit your deployed URL
2. Test user registration
3. Verify email auth works
4. Test database operations

### 4.2 Configure Supabase Redirect URLs

Update in Supabase dashboard:
- Authentication → URL Configuration
- Add your production domain callback URLs

### 4.3 Enable HTTPS

- Vercel: Automatic with free SSL
- Ensure all API calls use HTTPS
- Update `NEXT_PUBLIC_SUPABASE_URL` if needed

### 4.4 Database Backups

1. Go to Supabase → Backups
2. Enable automatic daily backups
3. Optionally enable Point-in-Time Recovery
4. Test backup restoration

## Continuous Integration/Deployment

### 4.5 GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

Get these secrets from Vercel project settings.

## Monitoring & Maintenance

### 5.1 Monitoring

#### Vercel Analytics
1. Go to Analytics tab
2. Monitor:
   - Page load times
   - Core Web Vitals
   - Error rates
   - Traffic patterns

#### Supabase Monitoring
1. Go to Supabase Dashboard
2. Check:
   - Database performance
   - Connection pool status
   - Storage usage
   - Auth metrics

### 5.2 Logging

#### Vercel Logs
- View in Deployments → Logs
- Function logs available in real-time
- Error tracking and traces

#### Database Logs
- View in Supabase → Logs
- Check slow queries
- Monitor authentication events

### 5.3 Backup Strategy

1. **Daily Backups**: Automatic via Supabase
2. **Weekly Snapshots**: Manual export (optional)
3. **Disaster Recovery**: Test restore process monthly
4. **Data Retention**: 30-day backup retention

## Scaling Considerations

### Database Scaling
- Supabase auto-scales PostgreSQL
- Monitor connection count
- Upgrade if approaching limits

### Function Scaling
- Vercel serverless functions auto-scale
- Monitor execution time
- Optimize long-running processes

### Storage Scaling
- Supabase Storage scales automatically
- Monitor bucket usage
- Clean up unused files

## Security Checklist

- [ ] Environment variables configured
- [ ] HTTPS enforced
- [ ] RLS policies enabled in Supabase
- [ ] Service role key kept secret
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] Rate limiting configured (future)
- [ ] CORS properly configured
- [ ] API authentication verified

## Troubleshooting

### Build Failures
```bash
# Clear Vercel cache and rebuild
vercel --prod --force

# Check build logs in Vercel dashboard
```

### Database Connection Issues
1. Verify environment variables in Vercel
2. Check Supabase project status
3. Test connection locally: `npm run test:db`

### Authentication Not Working
1. Verify redirect URLs in Supabase
2. Check cookie settings
3. Review browser console for errors

### Performance Issues
1. Check Vercel analytics
2. Profile database queries
3. Review Supabase performance insights
4. Optimize images and assets

## Rollback Procedure

### Code Rollback
1. Go to Vercel Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"
4. Confirm promotion

### Database Rollback
1. Go to Supabase Backups
2. Select restore point
3. Confirm restore
4. Verify data integrity

## Updating Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Verify tests pass
npm run test

# Deploy
git push origin main
```

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local_anon_key
```

### Staging (Optional)
```env
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging_anon_key
```

### Production
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=production_anon_key
```

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **GitHub Discussions**: Link to project discussions
- **Email Support**: support@pcl.platform

## Additional Notes

- Always test deployments in staging first
- Keep regular backups of critical data
- Monitor costs on Supabase and Vercel
- Use feature flags for gradual rollouts
- Maintain changelog of deployed versions

---

Last updated: December 2024
