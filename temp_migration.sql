
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'English';
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC+5:30 (India Standard Time)';
COMMENT ON COLUMN users.preferred_language IS 'User preferred language for interface';
COMMENT ON COLUMN users.timezone IS 'User timezone for date/time display';

