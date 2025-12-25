# Web App

The main Next.js frontend application for the PCL platform.

<!-- Environment variables updated: 2025-01-25 -->

## Structure

- `src/app` - Next.js app directory
- `src/components` - Reusable React components
- `src/lib` - Utility functions and Supabase clients
- `src/types` - TypeScript type definitions

## Key Features

- Server-side and client-side Supabase authentication
- Protected routes
- Database type definitions from schema
- API routes for backend operations

## Running Locally

```bash
cd apps/web
npm install
npm run dev
```

Visit `http://localhost:3000` to see the app.
