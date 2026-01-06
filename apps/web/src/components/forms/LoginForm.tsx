'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Mail } from 'lucide-react'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        // Check if it's an email confirmation error
        if (authError.message.toLowerCase().includes('email') || authError.message.toLowerCase().includes('confirm')) {
          throw new Error('Please confirm your email address before signing in. Check your inbox for the confirmation link.')
        }
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Login failed')
      }

      // Check if email is confirmed
      if (!authData.user.email_confirmed_at) {
        throw new Error('Please confirm your email address before signing in. Check your inbox for the confirmation link.')
      }

      // Get user role from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, kyc_status, is_active')
        .eq('id', authData.user.id)
        .single()

      if (userError || !userData) {
        console.error('User fetch error:', userError)
        throw new Error('Your account setup is incomplete. Please contact support or try signing up again.')
      }

      // Check if user is active
      if (!userData.is_active) {
        await supabase.auth.signOut()
        throw new Error('Your account has been deactivated. Please contact support.')
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id)

      // Redirect based on user role
      const dashboardPaths: Record<string, string> = {
        player: '/dashboard/player',
        club_owner: '/dashboard/club-owner',
        referee: '/dashboard/referee',
        staff: '/dashboard/staff',
        stadium_owner: '/dashboard/stadium-owner',
        admin: '/dashboard/admin',
      }

      const redirectPath = dashboardPaths[userData.role] || '/dashboard'
      router.push(redirectPath)
      router.refresh()

    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-accent/20">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your PCL account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert
              variant={error.toLowerCase().includes('email') && error.toLowerCase().includes('confirm') ? 'default' : 'destructive'}
              className={
                error.toLowerCase().includes('email') && error.toLowerCase().includes('confirm')
                  ? 'bg-amber-50 dark:bg-amber-950 border-amber-500 dark:border-amber-700'
                  : ''
              }
            >
              <div className="flex items-start gap-2">
                {error.toLowerCase().includes('email') && error.toLowerCase().includes('confirm') ? (
                  <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <AlertDescription className={
                  error.toLowerCase().includes('email') && error.toLowerCase().includes('confirm')
                    ? 'text-amber-800 dark:text-amber-200 font-medium'
                    : ''
                }>
                  {error}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john.doe@example.com"
              disabled={loading}
              autoComplete="email"
              className="focus-visible:ring-accent"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="/auth/forgot-password"
                className="text-sm text-accent hover:underline hover:text-accent-hover font-medium transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
              className="focus-visible:ring-accent"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full btn-lift"
            size="lg"
            variant="gradient"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <a href="/auth/signup" className="text-accent hover:underline hover:text-accent-hover font-medium transition-colors">
              Sign up
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
