-- Check what columns actually exist in the clubs table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clubs'
ORDER BY ordinal_position;
