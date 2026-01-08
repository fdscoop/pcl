'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const forgotPasswordSchema = z.object({
 email: z.string().email('Invalid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordForm() {
 const [error, setError] = useState<string | null>(null)
 const [success, setSuccess] = useState(false)
 const [loading, setLoading] = useState(false)

 const {
 register,
 handleSubmit,
 formState: { errors },
 } = useForm<ForgotPasswordFormData>({
 resolver: zodResolver(forgotPasswordSchema),
 })

 const onSubmit = async (data: ForgotPasswordFormData) => {
 try {
 setLoading(true)
 setError(null)
 setSuccess(false)

 const supabase = createClient()

 const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
 redirectTo: `${window.location.origin}/auth/reset-password`,
 })

 if (resetError) {
 throw new Error(resetError.message)
 }

 setSuccess(true)
 } catch (err: any) {
 console.error('Password reset error:', err)
 setError(err.message || 'Failed to send reset email')
 } finally {
 setLoading(false)
 }
 }

 return (
 <Card className="w-full max-w-md mx-auto">
 <CardHeader>
 <CardTitle className="text-2xl">Reset Your Password</CardTitle>
 <CardDescription>
 Enter your email address and we'll send you a link to reset your password
 </CardDescription>
 </CardHeader>

 {success ? (
 <CardContent>
 <Alert variant="success" className="mb-4">
 <AlertDescription>
 Password reset link sent! Check your email inbox and follow the instructions to reset your password.
 </AlertDescription>
 </Alert>
 <Button asChild className="w-full">
 <a href="/auth/login">Back to Login</a>
 </Button>
 </CardContent>
 ) : (
 <form onSubmit={handleSubmit(onSubmit)}>
 <CardContent className="space-y-4">
 {error && (
 <Alert variant="destructive">
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 )}

 <div className="space-y-2">
 <Label htmlFor="email">Email Address</Label>
 <Input
 id="email"
 type="email"
 {...register('email')}
 placeholder="john.doe@example.com"
 disabled={loading}
 autoComplete="email"
 />
 {errors.email && (
 <p className="text-sm text-red-600">{errors.email.message}</p>
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
 {loading ? 'Sending...' : 'Send Reset Link'}
 </Button>

 <p className="text-sm text-center text-gray-600">
 Remember your password?{' '}
 <a href="/auth/login" className="text-blue-600 hover:underline font-medium">
 Sign in
 </a>
 </p>
 </CardFooter>
 </form>
 )}
 </Card>
 )
}
