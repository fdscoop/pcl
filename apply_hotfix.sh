#!/bin/bash
# Simple script to apply the hotfix

echo "Applying Aadhaar trigger hotfix..."

PGPASSWORD='9,q7mBYqGK!fhL' psql -h aws-0-ap-south-1.pooler.supabase.com -p 6543 -U postgres.uuvxaefutyejlakxgxnr -d postgres -f HOTFIX_REMOVE_AADHAAR_TRIGGER.sql

echo "Hotfix complete!"