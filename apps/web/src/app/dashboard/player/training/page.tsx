'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dumbbell, Calendar, Clock, Target, TrendingUp, CheckCircle2, PlayCircle } from 'lucide-react'

export default function PlayerTraining() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [playerData, setPlayerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayerData()
  }, [])

  const loadPlayerData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserData(profile)

      // Get player profile
      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setPlayerData(player)
    } catch (error) {
      console.error('Error loading player data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sample training programs
  const trainingPrograms = [
    {
      id: 1,
      title: 'Speed & Agility Training',
      duration: '45 mins',
      difficulty: 'Intermediate',
      category: 'Physical',
      description: 'Improve your speed, acceleration, and change of direction',
      status: 'available',
      icon: Dumbbell,
      color: 'orange'
    },
    {
      id: 2,
      title: 'Ball Control Mastery',
      duration: '60 mins',
      difficulty: 'Advanced',
      category: 'Technical',
      description: 'Enhance your dribbling and ball control skills',
      status: 'in-progress',
      icon: Target,
      color: 'blue'
    },
    {
      id: 3,
      title: 'Shooting Accuracy',
      duration: '30 mins',
      difficulty: 'Beginner',
      category: 'Technical',
      description: 'Perfect your shooting technique and accuracy',
      status: 'available',
      icon: Target,
      color: 'green'
    },
    {
      id: 4,
      title: 'Tactical Positioning',
      duration: '50 mins',
      difficulty: 'Advanced',
      category: 'Tactical',
      description: 'Learn advanced positioning and game reading',
      status: 'completed',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      id: 5,
      title: 'Endurance Building',
      duration: '90 mins',
      difficulty: 'Intermediate',
      category: 'Physical',
      description: 'Build stamina and cardiovascular fitness',
      status: 'available',
      icon: Dumbbell,
      color: 'red'
    },
    {
      id: 6,
      title: 'Set Piece Practice',
      duration: '40 mins',
      difficulty: 'Intermediate',
      category: 'Technical',
      description: 'Master free kicks, corners, and penalties',
      status: 'available',
      icon: Target,
      color: 'teal'
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'Intermediate':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'Advanced':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="mt-2 text-slate-600">Loading training programs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Training Programs</h1>
        <p className="text-slate-600 mt-1">Develop your skills and reach your full potential</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Dumbbell className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">12</p>
            <p className="text-xs text-slate-600 font-medium">Total Programs</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">5</p>
            <p className="text-xs text-slate-600 font-medium">Completed</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <PlayCircle className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">2</p>
            <p className="text-xs text-slate-600 font-medium">In Progress</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">28</p>
            <p className="text-xs text-slate-600 font-medium">Total Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Training Programs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainingPrograms.map((program) => {
          const Icon = program.icon
          return (
            <Card
              key={program.id}
              className="border-2 border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-${program.color}-100`}>
                    <Icon className={`w-6 h-6 text-${program.color}-600`} />
                  </div>
                  <Badge className={getDifficultyColor(program.difficulty)}>
                    {program.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{program.title}</CardTitle>
                <CardDescription>{program.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{program.duration}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {program.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {program.status === 'completed' ? (
                    <Button
                      variant="outline"
                      className="w-full border-green-300 text-green-700 hover:bg-green-50"
                      disabled
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Completed
                    </Button>
                  ) : program.status === 'in-progress' ? (
                    <Button className="w-full bg-blue-500 hover:bg-blue-600">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Continue
                    </Button>
                  ) : (
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Training
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Upcoming Sessions */}
      <Card className="mt-6 border-2 border-slate-200">
        <CardHeader>
          <CardTitle>Upcoming Training Sessions</CardTitle>
          <CardDescription>Scheduled training with your club</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: 'Today, 5:00 PM', title: 'Team Practice', venue: 'Main Training Ground' },
              { date: 'Tomorrow, 6:00 PM', title: 'Strength & Conditioning', venue: 'Gym' },
              { date: 'Friday, 4:00 PM', title: 'Tactical Session', venue: 'Main Training Ground' }
            ].map((session, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div>
                  <p className="font-medium text-slate-900">{session.title}</p>
                  <p className="text-sm text-slate-600">{session.venue}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{session.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
