'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { UnreadContractBadge } from '@/components/UnreadContractBadge'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useClubNotifications } from '@/hooks/useClubNotifications'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { TeamBuildingAlert } from '../../../components/TeamBuildingAlert'

export default function ClubOwnerDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clubId, setClubId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeContractsCount, setActiveContractsCount] = useState(0)
  const [teamsCount, setTeamsCount] = useState(0)
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead
  } = useClubNotifications(clubId)
  const { unreadCount: unreadMessagesCount } = useUnreadMessages(userId)

  useEffect(() => {
    const supabase = createClient()

    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setUserData(profile)

        // Fetch user's club (only one club per owner)
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (clubError) {
          if (clubError.code !== 'PGRST116') { // Not found error is okay
            console.error('Error loading club:', clubError)
          }
        } else {
          setClub(clubData)
          setClubId(clubData.id)

          // Fetch active contracts count
          const { data: contractsData, error: contractsError } = await supabase
            .from('contracts')
            .select('id', { count: 'exact' })
            .eq('club_id', clubData.id)
            .eq('status', 'active')

          if (!contractsError && contractsData) {
            setActiveContractsCount(contractsData.length)
          }

          // Fetch teams count
          const { data: teamsData, error: teamsError } = await supabase
            .from('teams')
            .select('id', { count: 'exact' })
            .eq('club_id', clubData.id)

          if (!teamsError && teamsData) {
            setTeamsCount(teamsData.length)
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // If no club exists, show onboarding
  if (!loading && !club) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
                <span className="text-lg font-semibold text-foreground hidden sm:inline">
                  Professional Club League
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {userData?.first_name} {userData?.last_name}
                </span>
                <Button onClick={handleSignOut} variant="outline" size="sm" className="btn-lift">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome to PCL! 🏆
            </h1>
            <p className="text-lg text-muted-foreground">
              Create your club profile to get started
            </p>
          </div>

          <Card className="shadow-xl border-accent/20">
            <CardHeader>
              <CardTitle className="text-primary">Create Your Club Profile</CardTitle>
              <CardDescription>
                Set up your club to manage teams, scout players, and participate in tournaments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="info">
                <AlertDescription>
                  <strong>Note:</strong> Each account can create one club profile. Make sure to provide accurate information.
                </AlertDescription>
              </Alert>
              <Button
                variant="gradient"
                className="w-full btn-lift"
                size="lg"
                onClick={() => router.push('/club/create')}
              >
                Create Club Profile
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
              <span className="text-lg font-semibold text-foreground hidden sm:inline">
                Professional Club League
              </span>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                loading={notificationsLoading}
              />
              <span className="text-sm text-muted-foreground">
                {userData?.first_name} {userData?.last_name}
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="btn-lift">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Team Building Alert - Natural position in page flow */}
        <TeamBuildingAlert activeContractsCount={activeContractsCount} />

        {/* Club Profile Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            {/* Club Logo */}
            <div className="flex-shrink-0">
              {club?.logo_url ? (
                <img
                  src={club.logo_url}
                  alt={`${club.club_name} logo`}
                  className="h-24 w-24 rounded-lg object-cover border-2 border-border shadow-md"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center border-2 border-border shadow-md">
                  <span className="text-4xl">🏆</span>
                </div>
              )}
            </div>

            {/* Club Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {club?.club_name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent/20 text-accent border border-accent/30">
                  {club?.club_type}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success/20 text-success border border-success/30">
                  {club?.category}
                </span>
                {club?.is_active && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success/20 text-success border border-success/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-2">
                📍 {club?.city}, {club?.state}, {club?.country}
              </p>
              <p className="text-muted-foreground">
                📧 {club?.email} • 📞 {club?.phone}
              </p>
            </div>

            {/* Edit Button */}
            <div>
              <Button
                variant="gradient"
                className="btn-lift font-semibold"
                onClick={() => router.push(`/club/${club?.id}/edit`)}
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {club?.description && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-foreground">{club.description}</p>
            </div>
          )}
        </div>

        {/* New Messages Alert */}
        {unreadMessagesCount > 0 && (
          <Alert className="mb-8 border-2 border-destructive bg-gradient-to-r from-destructive/20 via-destructive/15 to-destructive/10 shadow-xl shadow-destructive/30 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💬</div>
              <div className="flex-1">
                <AlertTitle className="text-xl font-bold mb-2 text-destructive">
                  📬 You Have {unreadMessagesCount} New Message{unreadMessagesCount > 1 ? 's' : ''}!
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p className="text-foreground font-medium">
                    Player{unreadMessagesCount > 1 ? 's have' : ' has'} sent you new message{unreadMessagesCount > 1 ? 's' : ''}.
                    Check your inbox to read and respond to communications.
                  </p>
                  <div className="pt-3">
                    <Button
                      onClick={() => router.push('/dashboard/club-owner/messages')}
                      variant="destructive"
                      size="lg"
                      className="btn-lift shadow-lg font-bold"
                    >
                      📬 Read Messages ({unreadMessagesCount}) →
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Founded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{club?.founded_year}</div>
              <p className="text-xs text-muted-foreground mt-1">Est. year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{teamsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{teamsCount === 0 ? 'Create teams' : teamsCount === 1 ? '1 team created' : `${teamsCount} teams created`}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeContractsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeContractsCount === 0 ? 'Scout players' : 'Active contracts'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">No matches yet</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover border-2 hover:border-accent/50">
            <CardHeader>
              <CardTitle>👥 Manage Teams</CardTitle>
              <CardDescription>
                Create and organize your club teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="gradient"
                className="w-full btn-lift font-semibold"
                onClick={() => router.push('/dashboard/club-owner/team-management')}
              >
                Manage Team
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 hover:border-accent/50">
            <CardHeader>
              <CardTitle>🔍 Scout Players</CardTitle>
              <CardDescription>
                Find and invite verified players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="gradient"
                className="w-full btn-lift font-semibold"
                onClick={() => router.push('/scout/players')}
              >
                Browse Players
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover relative border-2 hover:border-accent/50">
            <CardHeader>
              <CardTitle className="relative inline-block">
                📋 Contracts
                <UnreadContractBadge userType="club_owner" />
              </CardTitle>
              <CardDescription>
                Manage player contracts and offers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="gradient"
                className="w-full btn-lift font-semibold"
                onClick={() => router.push('/dashboard/club-owner/contracts')}
              >
                View Contracts
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`card-hover cursor-pointer ${
              unreadMessagesCount > 0
                ? 'border-2 border-destructive bg-gradient-to-br from-destructive/20 via-destructive/10 to-destructive/5 shadow-xl shadow-destructive/30 animate-pulse hover:border-destructive/80'
                : 'border-2 hover:border-accent/50'
            }`}
            onClick={() => router.push('/dashboard/club-owner/messages')}
          >
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${
                unreadMessagesCount > 0 ? 'text-destructive' : ''
              }`}>
                💬 Messages
                {unreadMessagesCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse text-sm">
                    {unreadMessagesCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className={
                unreadMessagesCount > 0 ? 'text-foreground font-medium' : ''
              }>
                {unreadMessagesCount > 0
                  ? `You have ${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''} from players`
                  : 'Review player communications and respond quickly'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={unreadMessagesCount > 0 ? "destructive" : "outline"}
                size={unreadMessagesCount > 0 ? "lg" : "default"}
                className={`w-full btn-lift ${
                  unreadMessagesCount > 0 ? 'font-bold shadow-lg text-base' : ''
                }`}
                onClick={() => router.push('/dashboard/club-owner/messages')}
              >
                {unreadMessagesCount > 0 ? `📬 View ${unreadMessagesCount} New Message${unreadMessagesCount > 1 ? 's' : ''}` : 'Open Inbox'}
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 hover:border-accent/50">
            <CardHeader>
              <CardTitle>⚽ Matches</CardTitle>
              <CardDescription>
                Schedule and manage club matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
              <p className="text-sm mt-2">Activity will appear here once you start managing your club</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
