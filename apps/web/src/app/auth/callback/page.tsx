'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Confirming your email...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient()

        // Check if there's an error in the URL
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          setStatus('error')
          setMessage(errorDescription || 'Email confirmation failed. Please try signing up again.')
          setTimeout(() => {
            router.push('/auth/signup')
          }, 3000)
          return
        }

        // Get the session after email confirmation
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session) {
          setStatus('error')
          setMessage('Email confirmed! Please log in with your credentials.')
          setTimeout(() => {
            router.push('/auth/login')
          }, 2000)
          return
        }

        // Get user role from metadata
        const user = session.user
        const role = user.user_metadata?.role || 'player'

        setStatus('success')
        setMessage('Email confirmed successfully! Redirecting...')

        // Redirect based on role
        const redirectPaths: Record<string, string> = {
          player: '/onboarding/player',
          club_owner: '/onboarding/club-owner',
          referee: '/onboarding/referee',
          staff: '/onboarding/staff',
          stadium_owner: '/onboarding/stadium-owner',
        }

        setTimeout(() => {
          router.push(redirectPaths[role] || '/dashboard')
        }, 1500)
      } catch (err: any) {
        console.error('Callback error:', err)
        setStatus('error')
        setMessage('An error occurred during email confirmation. Please try again.')
        setTimeout(() => {
          router.push('/auth/signup')
        }, 3000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-xl border-accent/20">
        <CardHeader className="text-center">
          <CardTitle>Email Confirmation</CardTitle>
          <CardDescription>Verifying your email address</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
              <p className="text-center text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AuthCallbackSuspense() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-xl border-accent/20">
        <CardHeader className="text-center">
          <CardTitle>Email Confirmation</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackSuspense />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
