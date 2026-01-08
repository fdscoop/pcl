'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface TeamFormat {
 name: string
 emoji: string
 requiredPlayers: number
 description: string
 gradient: string
 textColor: string
}

const TEAM_FORMATS: TeamFormat[] = [
 {
 name: '5-a-side',
 emoji: '⚡',
 requiredPlayers: 8,
 description: '5 on field + 3 subs (min)',
 gradient: 'from-blue-500/20 to-cyan-500/20',
 textColor: 'text-blue-600'
 },
 {
 name: '7-a-side',
 emoji: '🎯',
 requiredPlayers: 11,
 description: '7 on field + 4 subs (min)',
 gradient: 'from-green-500/20 to-emerald-500/20',
 textColor: 'text-green-600'
 },
 {
 name: '11-a-side',
 emoji: '🏆',
 requiredPlayers: 14,
 description: '11 on field + 3 subs (min)',
 gradient: 'from-purple-500/20 to-pink-500/20',
 textColor: 'text-purple-600'
 }
]

interface RecruitmentProgressProps {
 activeContractsCount: number
}

export function RecruitmentProgress({ activeContractsCount }: RecruitmentProgressProps) {
 const router = useRouter()

 const getProgressPercentage = (required: number): number => {
 return Math.min((activeContractsCount / required) * 100, 100)
 }

 const getPlayersNeeded = (required: number): number => {
 return Math.max(required - activeContractsCount, 0)
 }

 const isComplete = (required: number): boolean => {
 return activeContractsCount >= required
 }

 return (
 <Card className="shadow-xl border-2 border-accent/30">
 <CardHeader>
 <div className="flex items-center justify-between">
 <div>
 <CardTitle className="text-2xl flex items-center gap-2">
 🎯 Team Building Progress
 </CardTitle>
 <CardDescription className="mt-2 text-base">
 You have <span className="font-bold text-foreground">{activeContractsCount}</span> active {activeContractsCount === 1 ? 'player' : 'players'}. Build your squad to compete in different formats!
 </CardDescription>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="space-y-6">
 {TEAM_FORMATS.map((format) => {
 const progress = getProgressPercentage(format.requiredPlayers)
 const playersNeeded = getPlayersNeeded(format.requiredPlayers)
 const complete = isComplete(format.requiredPlayers)

 return (
 <div
 key={format.name}
 className={`p-5 rounded-xl bg-gradient-to-r ${format.gradient} border-2 ${
 complete ? 'border-green-400 shadow-lg' : 'border-border'
 } transition-all`}
 >
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-3">
 <span className="text-3xl">{format.emoji}</span>
 <div>
 <h3 className={`text-lg font-bold ${format.textColor}`}>
 {format.name}
 </h3>
 <p className="text-sm text-muted-foreground">
 {format.description}
 </p>
 </div>
 </div>
 {complete && (
 <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
 ✓ Ready!
 </div>
 )}
 </div>

 <div className="space-y-2">
 <div className="flex justify-between text-sm">
 <span className="font-medium text-foreground">
 {activeContractsCount} / {format.requiredPlayers} players
 </span>
 <span className={`font-bold ${complete ? 'text-green-600' : format.textColor}`}>
 {complete ? 'Complete!' : `${playersNeeded} more needed`}
 </span>
 </div>
 <Progress
 value={progress}
 className={`h-3 ${complete ? 'bg-green-200' : ''}`}
 />
 </div>

 {!complete && playersNeeded > 0 && (
 <div className="mt-3 text-sm text-muted-foreground">
 💡 Recruit <span className="font-bold text-foreground">{playersNeeded}</span> more {playersNeeded === 1 ? 'player' : 'players'} to compete in {format.name} format
 </div>
 )}
 </div>
 )
 })}

 {activeContractsCount === 0 && (
 <div className="text-center py-8 bg-muted/50 rounded-lg border-2 border-dashed border-border">
 <div className="text-6xl mb-4">🔍</div>
 <h3 className="text-xl font-bold text-foreground mb-2">
 Start Building Your Team
 </h3>
 <p className="text-muted-foreground mb-4">
 You haven't recruited any players yet. Browse available players and send contract offers!
 </p>
 <Button
 variant="gradient"
 size="lg"
 className="btn-lift font-bold"
 onClick={() => router.push('/scout/players')}
 >
 🔍 Scout Players Now
 </Button>
 </div>
 )}

 {activeContractsCount > 0 && activeContractsCount < 18 && (
 <div className="text-center pt-4">
 <Button
 variant="outline"
 size="lg"
 className="btn-lift"
 onClick={() => router.push('/scout/players')}
 >
 🔍 Continue Scouting Players
 </Button>
 </div>
 )}

 {activeContractsCount >= 14 && (
 <div className="text-center py-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border-2 border-green-400">
 <div className="text-6xl mb-3">🎉</div>
 <h3 className="text-2xl font-bold text-green-600 mb-2">
 All Formats Unlocked!
 </h3>
 <p className="text-foreground font-medium mb-4">
 You can now compete in any team format including 11-a-side! {activeContractsCount >= 18 && 'You have a full squad with plenty of depth.'}
 </p>
 <div className="flex gap-3 justify-center flex-wrap">
 <Button
 variant="gradient"
 size="lg"
 className="btn-lift font-bold"
 onClick={() => router.push('/dashboard/club-owner/team-management')}
 >
 🏆 Manage Your Team
 </Button>
 <Button
 variant="outline"
 size="lg"
 className="btn-lift"
 onClick={() => router.push('/scout/players')}
 >
 🔍 Recruit More Players
 </Button>
 </div>
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 )
}
