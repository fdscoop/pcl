'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormationBuilder } from '@/components/FormationBuilder'
import { Card, CardContent } from '@/components/ui/card'

interface Player {
  id: string
  player_id: string
  jersey_number: number
  position_assigned: string
  players: {
    id: string
    position: string
    photo_url: string
    unique_player_id: string
    users: {
      first_name: string
      last_name: string
    }
  }
}

export default function FormationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get club
      const { data: clubData } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!clubData) {
        router.push('/dashboard/club-owner')
        return
      }

      setClub(clubData)

      // Check KYC verification status
      if (!clubData.kyc_verified) {
        router.replace('/dashboard/club-owner/kyc')
        return
      }

      // Get team
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('club_id', clubData.id)
        .maybeSingle()

      setTeam(teamData)

      if (teamData) {
        // Fetch squad players
        const { data: squadData } = await supabase
          .from('team_squads')
          .select('*')
          .eq('team_id', teamData.id)

        const squadPlayerIds = [...new Set(squadData?.map(s => s.player_id) || [])]

        if (squadPlayerIds.length > 0) {
          const { data: playersData } = await supabase
            .from('players')
            .select(`
              id,
              position,
              photo_url,
              unique_player_id,
              users (
                first_name,
                last_name
              )
            `)
            .in('id', squadPlayerIds)

          if (playersData && squadData) {
            const playersMap = new Map(playersData.map(p => [p.id, p]))
            const squadPlayers = squadData.map(squad => ({
              ...squad,
              players: playersMap.get(squad.player_id)
            }))
            setPlayers(squadPlayers as Player[])
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading formations...</div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen p-6">
        <Card className="max-w-2xl mx-auto border-2 border-dashed bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Team Created
              </h3>
              <p className="text-gray-600 mb-6">
                Create a team first to build formations
              </p>
              <button
                onClick={() => router.push('/dashboard/club-owner/team-management')}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg"
              >
                Go to Squad
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <Card className="max-w-2xl mx-auto border-2 border-dashed border-amber-300 bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⚽</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Squad Players
              </h3>
              <p className="text-gray-600 mb-6">
                Add players to your squad to create formations
              </p>
              <button
                onClick={() => router.push('/dashboard/club-owner/team-management')}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg"
              >
                Go to Squad
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-600 font-medium mb-1">welcome back 👋</p>
              <h1 className="text-4xl font-bold text-gray-900">Formation</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard/club-owner/team-management')}
              className="px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
            >
              view all squad
            </button>
          </div>
        </div>

        {/* Main Content - Full Width */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Formation</h2>
              <div className="text-sm text-gray-500">
                {players.length} players available
              </div>
            </div>

            {/* Formation Builder Component */}
            <FormationBuilder players={players} clubId={club?.id} teamId={team?.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
