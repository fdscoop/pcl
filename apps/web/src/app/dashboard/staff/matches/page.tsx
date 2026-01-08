'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, MapPin } from 'lucide-react'

export default function StaffMatches() {
 const router = useRouter()
 const supabase = createClient()
 const [loading, setLoading] = useState(true)
 const [matches, setMatches] = useState<any[]>([])

 useEffect(() => {
 loadMatches()
 }, [])

 const loadMatches = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) {
 router.push('/auth/login')
 return
 }

 const { data: staffData } = await supabase
 .from('staff')
 .select('id')
 .eq('user_id', user.id)
 .single()

 if (staffData) {
 const { data } = await supabase
 .from('match_assignments')
 .select(`
 *,
 match:matches (
 *,
 home_team:teams!matches_home_team_id_fkey (name),
 away_team:teams!matches_away_team_id_fkey (name)
 )
 `)
 .eq('staff_id', staffData.id)
 .eq('invitation_status', 'accepted')

 setMatches(data || [])
 }
 } catch (error) {
 console.error('Error:', error)
 } finally {
 setLoading(false)
 }
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
 </div>
 )
 }

 return (
 <div className="max-w-6xl mx-auto space-y-6">
 <div className="flex items-center gap-4">
 <Link href="/dashboard/staff">
 <Button variant="outline" size="icon">
 <ArrowLeft className="h-4 w-4" />
 </Button>
 </Link>
 <div>
 <h1 className="text-3xl font-bold">My Matches</h1>
 <p className="text-gray-600">View your accepted match assignments</p>
 </div>
 </div>

 {matches.length === 0 ? (
 <Card>
 <CardContent className="flex flex-col items-center justify-center py-12">
 <Calendar className="h-16 w-16 text-gray-400 mb-4" />
 <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
 <p className="text-gray-600 text-center mb-6">
 Accept match invitations to see them here
 </p>
 <Link href="/dashboard/staff/invitations">
 <Button>View Invitations</Button>
 </Link>
 </CardContent>
 </Card>
 ) : (
 <div className="grid gap-4">
 {matches.map((assignment: any) => (
 <Card key={assignment.id}>
 <CardHeader>
 <div className="flex justify-between items-start">
 <div>
 <CardTitle>
 {assignment.match.home_team.name} vs {assignment.match.away_team.name}
 </CardTitle>
 <CardDescription className="flex items-center gap-4 mt-2">
 <span className="flex items-center gap-1">
 <Calendar className="h-4 w-4" />
 {new Date(assignment.match.match_date).toLocaleDateString('en-IN')}
 </span>
 <span className="flex items-center gap-1">
 <MapPin className="h-4 w-4" />
 {assignment.match.venue}
 </span>
 </CardDescription>
 </div>
 <Badge>Confirmed</Badge>
 </div>
 </CardHeader>
 </Card>
 ))}
 </div>
 )}
 </div>
 )
}
