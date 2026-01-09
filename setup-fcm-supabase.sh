#!/bin/bash
# Script to configure FCM Service Account in Supabase

echo "🔧 FCM Service Account Setup for Supabase"
echo "=========================================="
echo ""
echo "📋 Prerequisites:"
echo "1. Download service account JSON from Firebase Console"
echo "   https://console.firebase.google.com/project/pcl-professional-club-league/settings/serviceaccounts/adminsdk"
echo "2. Click 'Generate new private key' and download the file"
echo ""
echo -n "Enter the path to your downloaded JSON file: "
read JSON_FILE_PATH

# Expand tilde
JSON_FILE_PATH="${JSON_FILE_PATH/#\~/$HOME}"

if [ ! -f "$JSON_FILE_PATH" ]; then
  echo "❌ Error: File not found: $JSON_FILE_PATH"
  exit 1
fi

echo ""
echo "✅ File found!"
echo "📝 Reading service account JSON..."

# Read the JSON file (compact, no newlines)
SERVICE_ACCOUNT_JSON=$(cat "$JSON_FILE_PATH" | tr -d '\n' | tr -d ' ')

# Validate it's valid JSON
if ! echo "$SERVICE_ACCOUNT_JSON" | jq . > /dev/null 2>&1; then
  echo "❌ Error: Invalid JSON file"
  exit 1
fi

# Extract project ID for verification
PROJECT_ID=$(echo "$SERVICE_ACCOUNT_JSON" | jq -r '.project_id')
echo "✅ Valid JSON - Project ID: $PROJECT_ID"

if [ "$PROJECT_ID" != "pcl-professional-club-league" ]; then
  echo "⚠️  Warning: Project ID doesn't match expected value"
  echo "   Expected: pcl-professional-club-league"
  echo "   Got: $PROJECT_ID"
  echo -n "Continue anyway? (y/n): "
  read CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    echo "Aborted"
    exit 1
  fi
fi

echo ""
echo "🔐 Setting Supabase secret..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Error: Supabase CLI not installed"
  echo "   Install: brew install supabase/tap/supabase"
  echo ""
  echo "Or set manually in Supabase Dashboard:"
  echo "https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/settings/functions"
  echo ""
  echo "Secret name: FCM_SERVICE_ACCOUNT"
  echo "Secret value:"
  echo "$SERVICE_ACCOUNT_JSON"
  exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
  echo "⚠️  Not logged in to Supabase"
  echo "🔐 Logging in..."
  supabase login
fi

# Link project if not linked
if [ ! -f ".supabase/config.toml" ]; then
  echo "🔗 Linking to Supabase project..."
  supabase link --project-ref uvifkmkdoiohqrdbwgzt
fi

# Set the secret
echo "📤 Uploading secret to Supabase..."
echo "$SERVICE_ACCOUNT_JSON" | supabase secrets set FCM_SERVICE_ACCOUNT --stdin

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ SUCCESS! FCM Service Account configured in Supabase"
  echo ""
  echo "📋 Next steps:"
  echo "1. The secret is now available to your Edge Functions"
  echo "2. No need to redeploy - it's immediately active"
  echo "3. Test by sending a message in your app"
  echo ""
  echo "🧪 To verify:"
  echo "   supabase secrets list"
  echo ""
else
  echo ""
  echo "❌ Failed to set secret"
  echo ""
  echo "Manual setup:"
  echo "1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/settings/vault"
  echo "2. Click 'New secret'"
  echo "3. Name: FCM_SERVICE_ACCOUNT"
  echo "4. Value: (paste the JSON content)"
  echo ""
  echo "JSON content:"
  echo "$SERVICE_ACCOUNT_JSON"
fi
