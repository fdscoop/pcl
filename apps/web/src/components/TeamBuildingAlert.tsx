'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { Target, Zap, Users, Trophy, Rocket, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TeamBuildingAlertProps {
  activeContractsCount: number
}

interface Milestone {
  players: number
  label: string
  format: string
}

interface AlertConfig {
  stage: 'start' | 'fiveaside' | 'sevenaside' | 'complete'
  title: string
  description: string
  playersNeeded: number
  emoji: string
  icon: React.ReactNode
  bgClass: string
  borderClass: string
  textClass: string
  buttonClass: string
  progressText: string
  buttonText: string
  accentColor: string
  progressBarColor: string
}

export function TeamBuildingAlert({ activeContractsCount }: TeamBuildingAlertProps) {
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(false)
  const [previousCount, setPreviousCount] = useState(activeContractsCount)

  // Milestones for progress visualization
  const milestones: Milestone[] = [
    { players: 8, label: '5-a-Side', format: '5v5' },
    { players: 11, label: '7-a-Side', format: '7v7' },
    { players: 14, label: '11-a-Side', format: '11v11' }
  ]

  // Detect when player count changes to trigger animation
  useEffect(() => {
    if (activeContractsCount > previousCount) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 500)
      return () => clearTimeout(timer)
    }
    setPreviousCount(activeContractsCount)
  }, [activeContractsCount, previousCount])

  const getAlertConfig = (): AlertConfig => {
    if (activeContractsCount === 0) {
      return {
        stage: 'start',
        title: '⚠️ No Players Yet',
        description: 'You have no players in your club. You MUST recruit at least 8 players before you can participate in any tournaments. Start scouting now to build your team!',
        playersNeeded: 8,
        emoji: '🚀',
        icon: <Rocket className="w-6 h-6 text-brand-orange animate-pulse" />,
        bgClass: 'bg-gradient-to-br from-brand-orange/5 via-brand-orange/10 to-brand-orange/5 dark:from-brand-orange/8 dark:via-brand-orange/15 dark:to-brand-orange/8',
        borderClass: 'border-brand-orange/30 shadow-brand-orange/20',
        textClass: 'text-brand-orange dark:text-brand-orange-light',
        buttonClass: 'bg-gradient-to-r from-brand-orange to-brand-orange-light hover:from-brand-orange-light hover:to-brand-orange text-white font-bold shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50',
        progressText: '0/14 players',
        buttonText: 'Start Scouting Now',
        accentColor: 'bg-brand-orange',
        progressBarColor: 'bg-gradient-to-r from-brand-orange via-brand-orange-light to-brand-orange'
      }
    }

    if (activeContractsCount < 8) {
      const needed = 8 - activeContractsCount
      return {
        stage: 'start',
        title: `⚡ ${needed} More Player${needed !== 1 ? 's' : ''} Needed`,
        description: `You have ${activeContractsCount} player${activeContractsCount !== 1 ? 's' : ''}. You need ${needed} more to reach 8 players. Once you have 8 players, you can start playing 5-a-side tournaments!`,
        playersNeeded: needed,
        emoji: '⚡',
        icon: <Zap className="w-6 h-6 text-brand-orange animate-pulse" />,
        bgClass: 'bg-gradient-to-br from-brand-orange/5 via-brand-orange/10 to-brand-orange/5 dark:from-brand-orange/8 dark:via-brand-orange/15 dark:to-brand-orange/8',
        borderClass: 'border-brand-orange/30 shadow-brand-orange/20',
        textClass: 'text-brand-orange dark:text-brand-orange-light',
        buttonClass: 'bg-gradient-to-r from-brand-orange to-brand-orange-light hover:from-brand-orange-light hover:to-brand-orange text-white font-bold shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50',
        progressText: `${activeContractsCount}/14 players`,
        buttonText: `Scout ${needed} More Players`,
        accentColor: 'bg-brand-orange',
        progressBarColor: 'bg-gradient-to-r from-brand-orange via-brand-orange-light to-brand-orange'
      }
    }

    if (activeContractsCount >= 8 && activeContractsCount < 11) {
      const needed = 11 - activeContractsCount
      return {
        stage: 'fiveaside',
        title: '🎯 Great! 5-a-Side Unlocked',
        description: `Congratulations! You have ${activeContractsCount} players. You can now play 5-a-side tournaments! Scout ${needed} more players to unlock 7-a-side tournaments with more match opportunities.`,
        playersNeeded: needed,
        emoji: '🎯',
        icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
        bgClass: 'bg-gradient-to-br from-emerald-50/80 via-emerald-100/50 to-emerald-50/80 dark:from-emerald-900/20 dark:via-emerald-800/30 dark:to-emerald-900/20',
        borderClass: 'border-emerald-300/50 shadow-emerald-200/30',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        buttonClass: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50',
        progressText: `${activeContractsCount}/14 players`,
        buttonText: `Scout ${needed} More Players`,
        accentColor: 'bg-emerald-500',
        progressBarColor: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600'
      }
    }

    if (activeContractsCount >= 11 && activeContractsCount < 14) {
      const needed = 14 - activeContractsCount
      return {
        stage: 'sevenaside',
        title: '🏆 Almost Complete!',
        description: `You have ${activeContractsCount} players and 7-a-side tournaments are unlocked! You're very close. Scout just ${needed} more player${needed !== 1 ? 's' : ''} to complete your full squad and unlock all tournament formats.`,
        playersNeeded: needed,
        emoji: '🏆',
        icon: <Users className="w-6 h-6 text-amber-500" />,
        bgClass: 'bg-gradient-to-br from-amber-50/80 via-amber-100/50 to-amber-50/80 dark:from-amber-900/20 dark:via-amber-800/30 dark:to-amber-900/20',
        borderClass: 'border-amber-300/50 shadow-amber-200/30',
        textClass: 'text-amber-700 dark:text-amber-400',
        buttonClass: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50',
        progressText: `${activeContractsCount}/14 players`,
        buttonText: `Scout Final ${needed} Player${needed !== 1 ? 's' : ''}`,
        accentColor: 'bg-amber-500',
        progressBarColor: 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'
      }
    }

    return {
      stage: 'complete',
      title: '✅ Squad Complete!',
      description: 'Excellent! You have 14 players and your squad is complete! All tournament formats (5-a-side, 7-a-side, and 11-a-side) are now unlocked. You can compete in all tournaments and manage your squad.',
      playersNeeded: 0,
      emoji: '🏆',
      icon: <Trophy className="w-6 h-6 text-brand-dark-blue dark:text-blue-400" />,
      bgClass: 'bg-gradient-to-br from-blue-50/80 via-blue-100/50 to-blue-50/80 dark:from-blue-900/20 dark:via-blue-800/30 dark:to-blue-900/20',
      borderClass: 'border-blue-300/50 shadow-blue-200/30',
      textClass: 'text-brand-dark-blue dark:text-blue-400',
      buttonClass: 'bg-gradient-to-r from-brand-dark-blue to-blue-600 hover:from-blue-600 hover:to-brand-dark-blue text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50',
      progressText: `${activeContractsCount} players`,
      buttonText: 'Manage Your Squad',
      accentColor: 'bg-brand-dark-blue',
      progressBarColor: 'bg-gradient-to-r from-brand-dark-blue via-blue-500 to-blue-600'
    }
  }

  const config = getAlertConfig()

  // Calculate overall progress (0-14 players)
  const maxPlayers = 14
  const progressPercentage = Math.min((activeContractsCount / maxPlayers) * 100, 100)

  return (
    <div className="mb-5">
      <Alert
        className={`relative border ${config.borderClass} ${config.bgClass} shadow-xl backdrop-blur-sm overflow-hidden transition-all duration-300 rounded-xl ${
          isAnimating ? 'scale-[1.02]' : ''
        }`}
      >
        {/* Subtle top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-40" />
        
        {/* Top Section - Icon and Title */}
        <div className="flex items-start gap-3 p-3 sm:p-4">
          {/* Icon - Prominent with subtle glow */}
          <div className="flex-shrink-0 pt-0.5">
            <div className={`w-11 h-11 flex items-center justify-center rounded-xl ${config.bgClass} border ${config.borderClass} shadow-lg backdrop-blur-sm`}>
              <div className={`${config.textClass} drop-shadow-sm`}>
                {config.icon}
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <AlertTitle className={`text-base sm:text-lg font-bold ${config.textClass} mb-1 drop-shadow-sm`}>
              {config.title}
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-foreground/90 leading-snug">
              {config.description}
            </AlertDescription>

            {/* Progress Section */}
            <div className="space-y-1.5 mt-3">
              {/* Progress Stats */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-foreground/80">👥 Squad Progress</span>
                <span className={`font-bold text-base sm:text-lg ${config.textClass} drop-shadow-sm`}>
                  {activeContractsCount}/{maxPlayers}
                </span>
              </div>

              {/* Progress Bar - Enhanced with glow */}
              <div className="relative">
                <div className="h-2.5 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded-full overflow-hidden border border-border/30 shadow-inner backdrop-blur-sm">
                  <div
                    className={`h-full ${config.progressBarColor} transition-all duration-700 ease-out relative overflow-hidden shadow-sm`}
                    style={{ width: `${progressPercentage}%` }}
                  >
                    {/* Enhanced shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    {/* Subtle glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                  </div>
                </div>
              </div>

              {/* Milestone Indicators - Enhanced */}
              <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                {milestones.map((milestone) => {
                  const isUnlocked = activeContractsCount >= milestone.players
                  const isCurrent = activeContractsCount < milestone.players && activeContractsCount >= (milestone.players - 3)

                  return (
                    <div
                      key={milestone.players}
                      className={`text-center p-1.5 rounded-lg border transition-all duration-300 backdrop-blur-sm ${
                        isUnlocked
                          ? `${config.bgClass} ${config.borderClass} shadow-md`
                          : isCurrent
                          ? `bg-gradient-to-br from-muted/20 to-muted/40 border-brand-orange/30 shadow-sm`
                          : `bg-gradient-to-br from-muted/10 to-muted/30 border-border/30`
                      }`}
                    >
                      <div className={`text-xs font-bold ${isUnlocked ? config.textClass : 'text-muted-foreground'}`}>
                        {milestone.label}
                      </div>
                      <div className={`text-xs font-semibold leading-tight ${isUnlocked ? config.textClass : 'text-muted-foreground'}`}>
                        {milestone.format}
                      </div>
                      {isUnlocked && <div className="text-sm leading-none animate-pulse">✓</div>}
                    </div>
                  )
                })}
              </div>

              {/* Progress Text - Enhanced */}
              <div className={`text-xs font-semibold ${config.textClass} pt-1 text-center leading-snug drop-shadow-sm`}>
                {activeContractsCount === 0 && '🚨 Urgent: No players yet! Start scouting now.'}
                {activeContractsCount > 0 && activeContractsCount < 8 && `Need ${8 - activeContractsCount} more players for 5-a-Side tournaments`}
                {activeContractsCount >= 8 && activeContractsCount < 11 && `Great! 5-a-Side ready. ${11 - activeContractsCount} more for 7-a-Side`}
                {activeContractsCount >= 11 && activeContractsCount < 14 && `Excellent! 7-a-Side ready. ${14 - activeContractsCount} more for complete squad`}
                {activeContractsCount >= 14 && '🎉 All formats unlocked! Your squad is complete.'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Section - Enhanced */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={() => config.stage === 'complete'
              ? router.push('/dashboard/club-owner/team-management')
              : router.push('/scout/players')
            }
            className={`${config.buttonClass} flex-1 sm:flex-initial font-semibold text-xs sm:text-sm py-1.5 px-3 transform hover:scale-105 active:scale-95 transition-transform`}
          >
            {config.stage === 'complete' ? '👥 ' : '🔍 '}
            {config.buttonText}
          </Button>
          
          {/* Create Team Button - Show when squad is complete or has enough players */}
          {activeContractsCount >= 8 && (
            <Button
              onClick={() => router.push('/dashboard/club-owner/team-management')}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs sm:text-sm py-1.5 px-3 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transform hover:scale-105 active:scale-95 transition-transform border-0"
            >
              ⚙️ Create Team
            </Button>
          )}

          {/* Matches Button - Show when team can participate in tournaments (8+ players for 5s, 11+ for 7s, 14+ for 11s) */}
          {activeContractsCount >= 8 && (
            <Button
              onClick={() => router.push('/dashboard/club-owner/matches')}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-xs sm:text-sm py-1.5 px-3 shadow-lg shadow-green-600/30 hover:shadow-green-600/50 transform hover:scale-105 active:scale-95 transition-transform border-0"
            >
              ⚽ Matches
            </Button>
          )}
        </div>
      </Alert>
    </div>
  )
}
