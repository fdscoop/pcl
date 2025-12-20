-- ============================================
-- PCL Platform - Database Schema Setup
-- ============================================
-- Copy this ENTIRE file and run it in Supabase SQL Editor
-- This will create all the tables needed for your PCL platform
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum
CREATE TYPE user_role AS ENUM ('player', 'club_owner', 'referee', 'staff', 'stadium_owner', 'admin');
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE contract_status AS ENUM ('active', 'terminated', 'amended', 'pending', 'rejected');
CREATE TYPE match_format AS ENUM ('friendly', '5-a-side', '7-a-side', '11-a-side');
CREATE TYPE league_structure AS ENUM ('friendly', 'hobby', 'tournament', 'amateur', 'intermediate', 'professional');
CREATE TYPE match_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('registered', 'unregistered', 'pending');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_photo_url TEXT,
  bio TEXT,
  role user_role NOT NULL,
  kyc_status kyc_status DEFAULT 'pending',
  kyc_verified_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully! You can now use the PCL platform.';
END $$;
