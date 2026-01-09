// Supabase Edge Function: send-push-notification
// Sends push notifications via Firebase Cloud Messaging API V1

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationRequest {
  user_id?: string
  user_ids?: string[]
  title: string
  body: string
  action_url?: string
  icon?: string
  data?: Record<string, any>
  tag?: string
}

interface FCMServiceAccount {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  universe_domain: string
}

// Helper to get OAuth2 access token for FCM V1
async function getAccessToken(serviceAccount: FCMServiceAccount): Promise<string> {
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))

  const now = Math.floor(Date.now() / 1000)
  const jwtClaimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: serviceAccount.token_uri,
    exp: now + 3600,
    iat: now
  }
  const jwtClaimSetEncoded = btoa(JSON.stringify(jwtClaimSet))

  // Import private key
  const privateKeyPEM = serviceAccount.private_key
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  const pemContents = privateKeyPEM
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  // Sign JWT
  const dataToSign = new TextEncoder().encode(`${jwtHeader}.${jwtClaimSetEncoded}`)
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    dataToSign
  )

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const jwt = `${jwtHeader}.${jwtClaimSetEncoded}.${signatureBase64}`

  // Exchange JWT for access token
  const tokenResponse = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get FCM Service Account from environment
    const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get('FCM_SERVICE_ACCOUNT')
    if (!FCM_SERVICE_ACCOUNT_JSON) {
      throw new Error('FCM_SERVICE_ACCOUNT not configured')
    }

    const serviceAccount: FCMServiceAccount = JSON.parse(FCM_SERVICE_ACCOUNT_JSON)
    const projectId = serviceAccount.project_id

    // Parse request body
    const payload: PushNotificationRequest = await req.json()

    // Validate payload
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title and body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!payload.user_id && !payload.user_ids) {
      return new Response(
        JSON.stringify({ error: 'Either user_id or user_ids must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user IDs to notify
    const userIds = payload.user_ids || (payload.user_id ? [payload.user_id] : [])

    // Fetch notification tokens for these users
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('token, user_id, device_type')
      .in('user_id', userIds)
      .eq('is_active', true)

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError)
      throw new Error('Failed to fetch notification tokens')
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active notification tokens found for specified users',
          sent_count: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccount)

    // Prepare FCM V1 message
    const results = []
    const errors = []

    for (const tokenData of tokens) {
      try {
        const message = {
          message: {
            token: tokenData.token,
            notification: {
              title: payload.title,
              body: payload.body,
              image: payload.icon || undefined,
            },
            webpush: {
              notification: {
                icon: payload.icon || '/logo.png',
                badge: '/badge.png',
                tag: payload.tag || 'pcl-notification',
                requireInteraction: false,
              },
              fcm_options: {
                link: payload.action_url || '/',
              },
            },
            data: {
              url: payload.action_url || '/',
              ...payload.data,
            },
          },
        }

        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
          }
        )

        const result = await response.json()

        if (response.ok) {
          results.push({
            user_id: tokenData.user_id,
            token: tokenData.token.substring(0, 20) + '...',
            status: 'sent',
            message_id: result.name,
          })

          // Update last_used_at for this token
          await supabase
            .from('notification_tokens')
            .update({ last_used_at: new Date().toISOString() })
            .eq('token', tokenData.token)
        } else {
          // Check if token is invalid
          const errorCode = result.error?.details?.[0]?.errorCode || result.error?.status

          if (
            errorCode === 'UNREGISTERED' ||
            errorCode === 'INVALID_ARGUMENT' ||
            result.error?.message?.includes('not a valid FCM registration token')
          ) {
            // Mark token as inactive
            await supabase
              .from('notification_tokens')
              .update({ is_active: false })
              .eq('token', tokenData.token)

            errors.push({
              user_id: tokenData.user_id,
              error: 'Token invalid or unregistered',
              status: 'token_deactivated',
            })
          } else {
            errors.push({
              user_id: tokenData.user_id,
              error: result.error?.message || 'Unknown error',
              status: 'failed',
            })
          }
        }
      } catch (error) {
        console.error('Error sending notification:', error)
        errors.push({
          user_id: tokenData.user_id,
          error: error.message || 'Unknown error',
          status: 'error',
        })
      }
    }

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        sent_count: results.length,
        error_count: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
