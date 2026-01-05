'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

interface Player {
  id: string
  user_id: string
  position: string
  photo_url: string
  unique_player_id: string
  preferred_foot: string
  height: number
  weight: number
  nationality: string
  date_of_birth: string
  current_club_id: string | null
  is_available_for_scout: boolean
  bio: string
  users: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone_number: string
  }
  player_stats: Array<{
    id: string
    goals: number
    assists: number
    matches_played: number
    yellow_cards: number
    red_cards: number
    minutes_played: number
    season: string
  }>
  contract?: {
    id: string
    status: string
    salary_monthly: number
    annual_salary: number
    signing_bonus: number
    goal_bonus: number
    appearance_bonus: number
    release_clause: number
    medical_insurance: number
    housing_allowance: number
    contract_start_date: string
    contract_end_date: string
    jersey_number: number
    position_assigned: string
    contract_type: string
    notice_period: number
    training_days_per_week: number
    image_rights: string
    created_at: string
  }
  squad?: {
    jersey_number: number
    is_active: boolean
  }
}

export default function ClubOwnerPlayerProfilePage() {
  const router = useRouter()
  const params = useParams()
  const playerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState<Player | null>(null)
  const [club, setClub] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlayerData()
  }, [playerId])

  const loadPlayerData = async () => {
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

      // Check KYC verification
      if (!clubData.kyc_verified) {
        router.replace('/dashboard/club-owner/kyc')
        return
      }

      // Fetch player data
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (playerError) {
        console.error('Error loading player:', playerError)
        setError('Player not found')
        return
      }

      console.log('Player data loaded:', playerData)

      // Fetch user data separately
      let userData = null
      if (playerData.user_id) {
        const { data: userDataResult, error: userError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, phone_number')
          .eq('id', playerData.user_id)
          .maybeSingle()

        if (userError) {
          console.error('Error loading user:', userError)
        } else {
          userData = userDataResult
        }
      }

      console.log('User data loaded:', userData)

      // Fetch player stats
      const { data: statsData, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', playerId)
        .order('season', { ascending: false })

      if (statsError) {
        console.error('Error loading stats:', statsError)
      }

      // Fetch contract data for this player with the current club
      let contractData = null
      if (clubData && clubData.id) {
        console.log('Fetching contract for player:', playerId, 'club:', clubData.id)

        // Try to fetch all contracts first to see if we have permission
        const { data: allContracts, error: allContractsError } = await supabase
          .from('contracts')
          .select('*')
          .eq('player_id', playerId)
          .eq('club_id', clubData.id)

        if (allContractsError) {
          console.error('Error loading contract:', allContractsError)
          console.error('Contract error details:', JSON.stringify(allContractsError, null, 2))
        } else {
          console.log('All contracts query result:', allContracts)
          // Get the most recent contract by sorting in JavaScript
          if (allContracts && allContracts.length > 0) {
            const sortedContracts = [...allContracts].sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            contractData = sortedContracts[0]
          }
        }
      }

      console.log('Contract data loaded:', contractData)

      // Fetch squad data from team_squads table
      let squadData = null
      if (clubData && clubData.id) {
        console.log('Fetching squad data for player:', playerId, 'club:', clubData.id)

        // Get team_id from teams table for this club
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id')
          .eq('club_id', clubData.id)
          .maybeSingle()

        if (teamError) {
          console.error('Error loading team:', teamError)
        } else if (teamData) {
          console.log('Team data:', teamData)

          // Fetch squad data
          const { data: squadResult, error: squadError } = await supabase
            .from('team_squads')
            .select('jersey_number, is_active')
            .eq('player_id', playerId)
            .eq('team_id', teamData.id)
            .maybeSingle()

          if (squadError) {
            console.error('Error loading squad data:', squadError)
          } else {
            console.log('Squad data loaded:', squadResult)
            squadData = squadResult

            // Update contract if jersey_number or position_assigned is null
            if (contractData && (contractData.jersey_number == null || contractData.position_assigned == null)) {
              const updates: { jersey_number?: number; position_assigned?: string } = {}

              if (contractData.jersey_number == null && squadResult?.jersey_number != null) {
                updates.jersey_number = squadResult.jersey_number
              }

              if (contractData.position_assigned == null && playerData?.position != null) {
                updates.position_assigned = playerData.position
              }

              if (Object.keys(updates).length > 0) {
                console.log('Updating contract with:', updates)
                const { error: updateError } = await supabase
                  .from('contracts')
                  .update(updates)
                  .eq('id', contractData.id)

                if (updateError) {
                  console.error('Error updating contract:', updateError)
                } else {
                  console.log('Contract updated successfully')
                  // Update local contractData to reflect the changes
                  contractData = { ...contractData, ...updates }
                }
              }
            }
          }
        }
      }

      // Combine the data
      const combinedPlayer = {
        ...playerData,
        users: userData,
        player_stats: statsData || [],
        contract: contractData,
        squad: squadData
      }

      console.log('Combined player data:', combinedPlayer)
      setPlayer(combinedPlayer)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load player data')
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading player profile...</div>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">{error || 'Player not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const latestStats = player.player_stats[0]
  const totalStats = player.player_stats.reduce(
    (acc, stat) => ({
      goals: acc.goals + stat.goals,
      assists: acc.assists + stat.assists,
      matches_played: acc.matches_played + stat.matches_played,
      yellow_cards: acc.yellow_cards + stat.yellow_cards,
      red_cards: acc.red_cards + stat.red_cards,
      minutes_played: acc.minutes_played + stat.minutes_played
    }),
    { goals: 0, assists: 0, matches_played: 0, yellow_cards: 0, red_cards: 0, minutes_played: 0 }
  )

  return (
    <div className="min-h-screen">
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-600 font-medium mb-1">player profile 👤</p>
              <h1 className="text-4xl font-bold text-gray-900">
                {player.users?.first_name} {player.users?.last_name}
              </h1>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-6">
              <div className="text-center mb-6">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={`${player.users?.first_name} ${player.users?.last_name}`}
                    className="h-40 w-40 rounded-full object-cover border-4 border-teal-100 shadow-lg mx-auto mb-4"
                  />
                ) : (
                  <div className="h-40 w-40 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg border-4 border-teal-100 mx-auto mb-4">
                    <span className="text-6xl text-white">⚽</span>
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {player.users?.first_name} {player.users?.last_name}
                </h2>
                <p className="text-gray-600 mb-3">ID: {player.unique_player_id}</p>
                <Badge className="bg-teal-100 text-teal-700 text-sm px-4 py-1">
                  {player.position}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-gray-600">Age</span>
                  <span className="font-semibold text-gray-900">
                    {player.date_of_birth ? calculateAge(player.date_of_birth) : 'N/A'} years
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-gray-600">Nationality</span>
                  <span className="font-semibold text-gray-900">{player.nationality || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-gray-600">Height</span>
                  <span className="font-semibold text-gray-900">{player.height ? `${player.height} cm` : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-gray-600">Weight</span>
                  <span className="font-semibold text-gray-900">{player.weight ? `${player.weight} kg` : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-gray-600">Preferred Foot</span>
                  <span className="font-semibold text-gray-900 capitalize">{player.preferred_foot || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={player.is_available_for_scout ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {player.is_available_for_scout ? 'Available' : 'Signed'}
                  </Badge>
                </div>
              </div>

              {player.bio && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{player.bio}</p>
                </div>
              )}
            </div>

            {/* Contract Info */}
            {player.contract && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Contract Information</h3>
                  <Badge className={
                    player.contract.status === 'active' ? 'bg-green-100 text-green-700' :
                    player.contract.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    player.contract.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }>
                    {player.contract.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Jersey Number</span>
                    <p className="font-semibold text-gray-900 text-lg">
                      #{player.squad?.jersey_number ?? player.contract.jersey_number ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Position Assigned</span>
                    <p className="font-medium text-gray-900">
                      {player.contract.position_assigned ?? player.position ?? 'N/A'}
                    </p>
                  </div>
                  {player.squad && (
                    <div>
                      <span className="text-sm text-gray-600">Squad Status</span>
                      <Badge className={player.squad.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {player.squad.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-600">Contract Type</span>
                    <p className="font-medium text-gray-900 capitalize">{player.contract.contract_type || 'N/A'}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-sm text-gray-600 font-semibold">Financial Details</span>
                  </div>

                  {player.contract.annual_salary != null && (
                    <div>
                      <span className="text-sm text-gray-600">Annual Salary</span>
                      <p className="font-semibold text-gray-900 text-lg">
                        ₹{player.contract.annual_salary.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {player.contract.salary_monthly != null && (
                    <div>
                      <span className="text-sm text-gray-600">Monthly Salary</span>
                      <p className="font-medium text-gray-900">
                        ₹{player.contract.salary_monthly.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {player.contract.signing_bonus != null && player.contract.signing_bonus > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Signing Bonus</span>
                      <p className="font-medium text-gray-900">
                        ₹{player.contract.signing_bonus.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {player.contract.goal_bonus != null && player.contract.goal_bonus > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Goal Bonus</span>
                      <p className="font-medium text-gray-900">
                        ₹{player.contract.goal_bonus.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {player.contract.appearance_bonus != null && player.contract.appearance_bonus > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Appearance Bonus</span>
                      <p className="font-medium text-gray-900">
                        ₹{player.contract.appearance_bonus.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {player.contract.release_clause != null && player.contract.release_clause > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Release Clause</span>
                      <p className="font-medium text-gray-900">
                        ₹{player.contract.release_clause.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-sm text-gray-600">Contract Period</span>
                    <p className="font-medium text-gray-900">
                      {new Date(player.contract.contract_start_date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {' → '}
                      {new Date(player.contract.contract_end_date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Contract Duration</span>
                    <p className="font-medium text-gray-900">
                      {(() => {
                        const start = new Date(player.contract.contract_start_date)
                        const end = new Date(player.contract.contract_end_date)
                        const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
                        const years = Math.floor(months / 12)
                        const remainingMonths = months % 12
                        return years > 0
                          ? `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`
                          : `${months} month${months > 1 ? 's' : ''}`
                      })()}
                    </p>
                  </div>

                  {player.contract.notice_period != null && (
                    <div>
                      <span className="text-sm text-gray-600">Notice Period</span>
                      <p className="font-medium text-gray-900">{player.contract.notice_period} days</p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => router.push(`/dashboard/club-owner/contracts/${player.contract?.id}/view`)}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-md"
                    >
                      View Full Contract
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-6 mt-6">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Email</span>
                  <p className="font-medium text-gray-900">{player.users?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Phone</span>
                  <p className="font-medium text-gray-900">{player.users?.phone_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Career Stats */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Career Statistics</h2>
                <p className="text-teal-50 text-sm mt-1">Overall performance metrics</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{totalStats.goals}</div>
                    <div className="text-sm text-blue-700 font-medium">Goals</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{totalStats.assists}</div>
                    <div className="text-sm text-green-700 font-medium">Assists</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{totalStats.matches_played}</div>
                    <div className="text-sm text-purple-700 font-medium">Matches</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-1">{totalStats.yellow_cards}</div>
                    <div className="text-sm text-yellow-700 font-medium">Yellow Cards</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-red-600 mb-1">{totalStats.red_cards}</div>
                    <div className="text-sm text-red-700 font-medium">Red Cards</div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">
                      {Math.round(totalStats.minutes_played / 60)}
                    </div>
                    <div className="text-sm text-indigo-700 font-medium">Hours Played</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Season by Season Stats */}
            {player.player_stats.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Season Statistics</h2>
                  <p className="text-blue-50 text-sm mt-1">Performance breakdown by season</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {player.player_stats.map((stat) => (
                      <div
                        key={stat.id}
                        className="border-2 border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-gray-900 text-lg">{stat.season}</h3>
                          <Badge className="bg-blue-100 text-blue-700">
                            {stat.matches_played} matches
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{stat.goals}</div>
                            <div className="text-xs text-gray-600">Goals</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{stat.assists}</div>
                            <div className="text-xs text-gray-600">Assists</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-yellow-600">{stat.yellow_cards}</div>
                            <div className="text-xs text-gray-600">Yellow</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-600">{stat.red_cards}</div>
                            <div className="text-xs text-gray-600">Red</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{stat.minutes_played}</div>
                            <div className="text-xs text-gray-600">Minutes</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {player.player_stats.length === 0 && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-12">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg font-semibold text-gray-700 mb-2">No Statistics Available</p>
                  <p className="text-sm text-gray-500">Player statistics will appear here once available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
