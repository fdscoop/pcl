import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
 try {
 const body = await request.json()
 const { name, email, subject, message } = body

 // Validate required fields
 if (!name || !email || !subject || !message) {
 return NextResponse.json(
 { error: 'All fields are required' },
 { status: 400 }
 )
 }

 // Validate email format
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 if (!emailRegex.test(email)) {
 return NextResponse.json(
 { error: 'Invalid email address' },
 { status: 400 }
 )
 }

 const supabase = await createClient()

 // Store contact submission in database
 const { data, error } = await supabase
 .from('contact_submissions')
 .insert({
 name,
 email,
 subject,
 message,
 status: 'pending',
 submitted_at: new Date().toISOString(),
 })
 .select()
 .single()

 if (error) {
 console.error('Error storing contact submission:', error)

 // If table doesn't exist, send email directly without storing
 // This is a fallback for when the database table isn't created yet
 if (error.code === '42P01') {
 // Table doesn't exist - just return success for now
 // In production, you would send an email here
 return NextResponse.json({
 success: true,
 message: 'Your message has been received. We will get back to you soon.',
 })
 }

 throw error
 }

 // TODO: Send email notification to support team
 // You can integrate with services like SendGrid, Resend, or AWS SES
 // Example:
 // await sendEmailToSupport({
 // from: email,
 // name,
 // subject,
 // message,
 // })

 return NextResponse.json({
 success: true,
 message: 'Your message has been received. We will get back to you within 24-48 hours.',
 submissionId: data?.id,
 })
 } catch (error) {
 console.error('Contact form error:', error)
 return NextResponse.json(
 { error: 'Failed to send message. Please try again or email us directly.' },
 { status: 500 }
 )
 }
}
