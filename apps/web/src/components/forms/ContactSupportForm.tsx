'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Send, CheckCircle2, Loader2 } from 'lucide-react'

// Validation schema
const contactSchema = z.object({
 name: z.string().min(2, 'Name must be at least 2 characters'),
 email: z.string().email('Invalid email address'),
 subject: z.string().min(5, 'Subject must be at least 5 characters'),
 message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactSupportFormProps {
 onSuccess?: () => void
 defaultSubject?: string
}

export default function ContactSupportForm({ onSuccess, defaultSubject }: ContactSupportFormProps) {
 const [error, setError] = useState<string | null>(null)
 const [success, setSuccess] = useState(false)
 const [loading, setLoading] = useState(false)

 const {
 register,
 handleSubmit,
 reset,
 formState: { errors },
 } = useForm<ContactFormData>({
 resolver: zodResolver(contactSchema),
 defaultValues: {
 subject: defaultSubject || '',
 },
 })

 const onSubmit = async (data: ContactFormData) => {
 try {
 setLoading(true)
 setError(null)
 setSuccess(false)

 // Send contact form data to API endpoint
 const response = await fetch('/api/contact', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify(data),
 })

 if (!response.ok) {
 const errorData = await response.json()
 throw new Error(errorData.error || 'Failed to send message')
 }

 setSuccess(true)
 reset()

 if (onSuccess) {
 onSuccess()
 }

 // Auto-hide success message after 5 seconds
 setTimeout(() => {
 setSuccess(false)
 }, 5000)
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
 } finally {
 setLoading(false)
 }
 }

 return (
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
 {error && (
 <Alert variant="destructive">
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 )}

 {success && (
 <Alert className="bg-green-50 text-green-900 border-green-200">
 <CheckCircle2 className="h-4 w-4" />
 <AlertDescription>
 Message sent successfully! Our support team will get back to you within 24-48 hours.
 </AlertDescription>
 </Alert>
 )}

 <div className="space-y-2">
 <Label htmlFor="name">Your Name *</Label>
 <Input
 id="name"
 type="text"
 placeholder="John Doe"
 {...register('name')}
 className={errors.name ? 'border-red-500' : ''}
 disabled={loading}
 />
 {errors.name && (
 <p className="text-sm text-red-500">{errors.name.message}</p>
 )}
 </div>

 <div className="space-y-2">
 <Label htmlFor="email">Email Address *</Label>
 <Input
 id="email"
 type="email"
 placeholder="john@example.com"
 {...register('email')}
 className={errors.email ? 'border-red-500' : ''}
 disabled={loading}
 />
 {errors.email && (
 <p className="text-sm text-red-500">{errors.email.message}</p>
 )}
 </div>

 <div className="space-y-2">
 <Label htmlFor="subject">Subject *</Label>
 <Input
 id="subject"
 type="text"
 placeholder="How can we help you?"
 {...register('subject')}
 className={errors.subject ? 'border-red-500' : ''}
 disabled={loading}
 />
 {errors.subject && (
 <p className="text-sm text-red-500">{errors.subject.message}</p>
 )}
 </div>

 <div className="space-y-2">
 <Label htmlFor="message">Message *</Label>
 <Textarea
 id="message"
 placeholder="Please describe your question or issue in detail..."
 rows={6}
 {...register('message')}
 className={errors.message ? 'border-red-500' : ''}
 disabled={loading}
 />
 {errors.message && (
 <p className="text-sm text-red-500">{errors.message.message}</p>
 )}
 </div>

 <Button
 type="submit"
 disabled={loading}
 className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold py-6 text-lg"
 >
 {loading ? (
 <>
 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
 Sending...
 </>
 ) : (
 <>
 <Send className="mr-2 h-5 w-5" />
 Send Message
 </>
 )}
 </Button>

 <p className="text-sm text-muted-foreground text-center">
 Or email us directly at{' '}
 <a
 href="mailto:support@professionalclubleague.com"
 className="text-[#f97316] hover:underline font-medium"
 >
 support@professionalclubleague.com
 </a>
 </p>
 </form>
 )
}
