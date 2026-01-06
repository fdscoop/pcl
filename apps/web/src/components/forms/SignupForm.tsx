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
import { Mail, AlertCircle } from 'lucide-react'

// User role types
const userRoles = [
  { value: 'player', label: 'Player', description: 'Create profile, sign contracts, track performance' },
  { value: 'club_owner', label: 'Club Owner', description: 'Manage clubs, teams, and players' },
  { value: 'referee', label: 'Referee', description: 'Officiate matches and tournaments' },
  { value: 'staff', label: 'Staff/Volunteer', description: 'Support match operations' },
  { value: 'stadium_owner', label: 'Stadium Owner', description: 'List and manage stadiums' },
] as const

// Validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum(['player', 'club_owner', 'referee', 'staff', 'stadium_owner']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('player')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'player',
    },
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      setEmailSent(false)
      setUserEmail(data.email)

      const supabase = createClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            role: data.role,
          },
        },
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      // 2. Create user record in our custom users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone || null,
          role: data.role,
          kyc_status: 'pending',
          is_active: true,
        })

      if (userError) {
        console.error('User creation error:', userError)
        
        // If user record creation fails, we should still inform about email confirmation
        if (authData.user.identities && authData.user.identities.length === 0) {
          // Email already exists
          throw new Error('An account with this email already exists')
        }
        
        // User was created in auth, show success message for email confirmation
        setEmailSent(true)
        setSuccess(true)
        return
      }

      // 3. Success - show email confirmation message
      setEmailSent(true)
      setSuccess(true)

    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-accent/20">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Create Your PCL Account</CardTitle>
        <CardDescription>
          Join the Professional Club League platform
        </CardDescription>
      </CardHeader>

      {/* Show success message if email was sent */}
      {emailSent && success ? (
        <CardContent className="py-12">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Check Your Email!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We've sent a confirmation link to <span className="font-semibold text-foreground">{userEmail}</span>
              </p>
            </div>

            <Alert className="max-w-md mx-auto bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong className="block mb-1">Important:</strong>
                Click the confirmation link in your email to activate your account. Check your spam folder if you don't see it.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => router.push('/auth/login')}
                variant="gradient"
                className="w-full max-w-xs mx-auto btn-lift"
              >
                Go to Login
              </Button>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email?{' '}
                <button 
                  onClick={() => {
                    setEmailSent(false)
                    setSuccess(false)
                  }}
                  className="text-accent hover:underline font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-2">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* User Role Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">I want to register as:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userRoles.map((role) => (
                <div
                  key={role.value}
                  onClick={() => {
                    setSelectedRole(role.value)
                    setValue('role', role.value)
                  }}
                  className={`
                    cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                    ${selectedRole === role.value
                      ? 'border-accent bg-accent/10 shadow-lg ring-2 ring-accent/30 transform scale-[1.02]'
                      : 'border-border hover:border-accent/50 hover:shadow-md hover:bg-accent/5 bg-card'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      {...register('role')}
                      value={role.value}
                      checked={selectedRole === role.value}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-foreground">{role.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="John"
                disabled={loading}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Doe"
                disabled={loading}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john.doe@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+1 234 567 8900"
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="At least 8 characters"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              placeholder="Re-enter your password"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            variant="gradient"
            className="w-full btn-lift"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <a href="/auth/login" className="text-accent hover:underline hover:text-accent-hover font-medium transition-colors">
              Sign in
            </a>
          </p>
        </CardFooter>
      </form>
      )}
    </Card>
  )
}
