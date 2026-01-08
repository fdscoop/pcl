'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/context/ToastContext'
import { ArrowLeft, Calendar, CheckCircle2, XCircle } from 'lucide-react'

export default function RefereeAvailability() {
 const router = useRouter()
 const supabase = createClient()
 const { addToast } = useToast()
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [refereeId, setRefereeId] = useState<string>('')
 const [isAvailable, setIsAvailable] = useState(false)
 const [availabilityCalendar, setAvailabilityCalendar] = useState<any>(null)

 useEffect(() => {
 loadAvailability()
 }, [])

 const loadAvailability = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) {
 router.push('/auth/login')
 return
 }

 const { data: refereeData } = await supabase
 .from('referees')
 .select('id, is_available, availability_calendar')
 .eq('user_id', user.id)
 .single()

 if (!refereeData) {
 addToast({ title: 'Please complete your profile first', type: 'error' })
 router.push('/dashboard/referee/profile')
 return
 }

 setRefereeId(refereeData.id)
 setIsAvailable(refereeData.is_available || false)
 setAvailabilityCalendar(refereeData.availability_calendar)
 } catch (error) {
 console.error('Error:', error)
 } finally {
 setLoading(false)
 }
 }

 const handleToggleAvailability = async () => {
 try {
 setSaving(true)

 const newStatus = !isAvailable

 const { error } = await supabase
 .from('referees')
 .update({ 
 is_available: newStatus,
 updated_at: new Date().toISOString()
 })
 .eq('id', refereeId)

 if (error) throw error

 setIsAvailable(newStatus)
 addToast({ 
 title: 'Availability Updated',
 description: newStatus ? 'You are now available for matches!' : 'You are now unavailable for matches',
 type: 'success'
 })
 } catch (error: any) {
 console.error('Update error:', error)
 addToast({ 
 title: 'Error',
 description: error.message || 'Failed to update availability', 
 type: 'error' 
 })
 } finally {
 setSaving(false)
 }
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
 <p className="mt-4 text-gray-600">Loading availability...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="max-w-4xl mx-auto space-y-6">
 <div className="flex items-center gap-4">
 <Link href="/dashboard/referee">
 <Button variant="outline" size="icon">
 <ArrowLeft className="h-4 w-4" />
 </Button>
 </Link>
 <div>
 <h1 className="text-3xl font-bold">Availability</h1>
 <p className="text-gray-600">Manage when you're available for matches</p>
 </div>
 </div>

 {/* Current Status */}
 <Card>
 <CardHeader>
 <CardTitle>Current Availability Status</CardTitle>
 <CardDescription>
 Toggle your availability to let clubs know if you can officiate matches
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
 <div className="flex items-center gap-4">
 {isAvailable ? (
 <div className="flex items-center gap-2">
 <CheckCircle2 className="h-8 w-8 text-green-600" />
 <div>
 <p className="text-xl font-bold text-green-600">Available</p>
 <p className="text-sm text-gray-600">You're visible to clubs for match assignments</p>
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <XCircle className="h-8 w-8 text-red-600" />
 <div>
 <p className="text-xl font-bold text-red-600">Unavailable</p>
 <p className="text-sm text-gray-600">You won't receive new match invitations</p>
 </div>
 </div>
 )}
 </div>

 <div className="flex items-center space-x-2">
 <Switch
 checked={isAvailable}
 onCheckedChange={handleToggleAvailability}
 disabled={saving}
 />
 <Label htmlFor="availability-toggle" className="cursor-pointer">
 {saving ? 'Updating...' : isAvailable ? 'Available' : 'Unavailable'}
 </Label>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Information Card */}
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2">
 <Calendar className="h-5 w-5 text-primary" />
 <CardTitle>How It Works</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-3">
 <div className="flex gap-3">
 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
 1
 </div>
 <div>
 <h4 className="font-semibold">Set Your Availability</h4>
 <p className="text-sm text-gray-600">
 Turn on availability when you're ready to accept match assignments
 </p>
 </div>
 </div>

 <div className="flex gap-3">
 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
 2
 </div>
 <div>
 <h4 className="font-semibold">Receive Invitations</h4>
 <p className="text-sm text-gray-600">
 Clubs can send you match invitations based on your profile and location
 </p>
 </div>
 </div>

 <div className="flex gap-3">
 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
 3
 </div>
 <div>
 <h4 className="font-semibold">Accept or Reject</h4>
 <p className="text-sm text-gray-600">
 Review match details and choose which matches you want to officiate
 </p>
 </div>
 </div>

 <div className="flex gap-3">
 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
 4
 </div>
 <div>
 <h4 className="font-semibold">Get Paid</h4>
 <p className="text-sm text-gray-600">
 Complete matches and receive payments directly to your verified bank account
 </p>
 </div>
 </div>
 </div>

 <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
 <p className="text-sm text-blue-800">
 <strong>💡 Tip:</strong> Keep your availability updated to ensure you don't miss out on match opportunities. 
 You can toggle this on/off anytime based on your schedule.
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Quick Actions */}
 <Card>
 <CardHeader>
 <CardTitle>Quick Actions</CardTitle>
 <CardDescription>Manage your referee profile and invitations</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Link href="/dashboard/referee/invitations">
 <Button variant="outline" className="w-full justify-start">
 <Calendar className="h-4 w-4 mr-2" />
 View Match Invitations
 </Button>
 </Link>

 <Link href="/dashboard/referee/profile">
 <Button variant="outline" className="w-full justify-start">
 <Calendar className="h-4 w-4 mr-2" />
 Update Profile
 </Button>
 </Link>

 <Link href="/dashboard/referee/kyc">
 <Button variant="outline" className="w-full justify-start">
 <Calendar className="h-4 w-4 mr-2" />
 Complete KYC
 </Button>
 </Link>

 <Link href="/dashboard/referee/certifications">
 <Button variant="outline" className="w-full justify-start">
 <Calendar className="h-4 w-4 mr-2" />
 Manage Certifications
 </Button>
 </Link>
 </div>
 </CardContent>
 </Card>
 </div>
 )
}
