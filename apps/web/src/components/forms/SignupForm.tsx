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

      const supabase = createClient()

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
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
        throw new Error('Failed to create user profile')
      }

      // 3. Redirect based on role
      const redirectPaths: Record<string, string> = {
        player: '/onboarding/player',
        club_owner: '/onboarding/club-owner',
        referee: '/onboarding/referee',
        staff: '/onboarding/staff',
        stadium_owner: '/onboarding/stadium-owner',
      }

      router.push(redirectPaths[data.role] || '/dashboard')

    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create Your PCL Account</CardTitle>
        <CardDescription>
          Join the Professional Club League platform
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
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
                      ? 'border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-200 transform scale-[1.02]'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30 bg-white'
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
                      <h3 className="font-semibold text-sm">{role.label}</h3>
                      <p className="text-xs text-gray-600 mt-1">{role.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
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
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
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
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
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
              <p className="text-sm text-red-600">{errors.email.message}</p>
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
              <p className="text-sm text-red-600">{errors.phone.message}</p>
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
              <p className="text-sm text-red-600">{errors.password.message}</p>
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
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <a href="/auth/login" className="text-blue-600 hover:underline hover:text-blue-800 font-medium transition-colors">
              Sign in
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
