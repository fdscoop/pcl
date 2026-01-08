/**
 * Position-specific statistics mapping and utilities
 * Provides intelligent stats display based on player position
 */

export type PlayerPosition = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward' | string

export interface PositionStat {
 key: string
 label: string
 icon: string
 getValue: (playerData: any) => string | number
 color?: string
}

/**
 * Get position category from position string
 */
export function getPositionCategory(position: string | null | undefined): PlayerPosition {
 if (!position) return 'Forward'

 const pos = position.toLowerCase()

 // Goalkeeper
 if (pos.includes('goalkeeper') || pos.includes('gk')) {
 return 'Goalkeeper'
 }

 // Defenders
 if (
 pos.includes('defender') ||
 pos.includes('defence') ||
 pos.includes('def') ||
 pos.includes('cb') ||
 pos.includes('lb') ||
 pos.includes('rb') ||
 pos.includes('center back') ||
 pos.includes('left back') ||
 pos.includes('right back') ||
 pos.includes('wing back')
 ) {
 return 'Defender'
 }

 // Midfielders
 if (
 pos.includes('midfielder') ||
 pos.includes('midfield') ||
 pos.includes('mid') ||
 pos.includes('cm') ||
 pos.includes('dm') ||
 pos.includes('am') ||
 pos.includes('central midfielder') ||
 pos.includes('defensive midfielder') ||
 pos.includes('attacking midfielder')
 ) {
 return 'Midfielder'
 }

 // Forwards (default)
 return 'Forward'
}

/**
 * Get position-specific stats configuration
 */
export function getPositionStats(position: string | null | undefined): PositionStat[] {
 const category = getPositionCategory(position)

 switch (category) {
 case 'Goalkeeper':
 return [
 {
 key: 'matches_played',
 label: 'Matches Played',
 icon: '🧤',
 getValue: (data) => data?.total_matches_played || 0,
 color: 'primary'
 },
 {
 key: 'clean_sheets',
 label: 'Clean Sheets',
 icon: '🛡️',
 getValue: (data) => {
 // Calculate from match data if available, otherwise placeholder
 return data?.clean_sheets || 0
 },
 color: 'success'
 },
 {
 key: 'saves',
 label: 'Total Saves',
 icon: '✋',
 getValue: (data) => data?.total_saves || 0,
 color: 'accent'
 },
 {
 key: 'goals_conceded',
 label: 'Goals Conceded',
 icon: '⚠️',
 getValue: (data) => data?.goals_conceded || 0,
 color: 'destructive'
 }
 ]

 case 'Defender':
 return [
 {
 key: 'matches_played',
 label: 'Matches Played',
 icon: '⚔️',
 getValue: (data) => data?.total_matches_played || 0,
 color: 'primary'
 },
 {
 key: 'tackles',
 label: 'Tackles',
 icon: '🦵',
 getValue: (data) => data?.total_tackles || 0,
 color: 'success'
 },
 {
 key: 'interceptions',
 label: 'Interceptions',
 icon: '🚫',
 getValue: (data) => data?.total_interceptions || 0,
 color: 'accent'
 },
 {
 key: 'cards',
 label: 'Cards (Y/R)',
 icon: '🟨',
 getValue: (data) => {
 const yellow = data?.yellow_cards || 0
 const red = data?.red_cards || 0
 return `${yellow}/${red}`
 },
 color: 'warning'
 }
 ]

 case 'Midfielder':
 return [
 {
 key: 'matches_played',
 label: 'Matches Played',
 icon: '⚽',
 getValue: (data) => data?.total_matches_played || 0,
 color: 'primary'
 },
 {
 key: 'goals',
 label: 'Goals',
 icon: '🎯',
 getValue: (data) => data?.total_goals_scored || 0,
 color: 'success'
 },
 {
 key: 'assists',
 label: 'Assists',
 icon: '🎁',
 getValue: (data) => data?.total_assists || 0,
 color: 'accent'
 },
 {
 key: 'pass_accuracy',
 label: 'Pass Accuracy',
 icon: '📊',
 getValue: (data) => {
 const accuracy = data?.pass_accuracy || 0
 return accuracy > 0 ? `${accuracy}%` : 'N/A'
 },
 color: 'primary'
 }
 ]

 case 'Forward':
 default:
 return [
 {
 key: 'matches_played',
 label: 'Matches Played',
 icon: '🏃',
 getValue: (data) => data?.total_matches_played || 0,
 color: 'primary'
 },
 {
 key: 'goals',
 label: 'Goals Scored',
 icon: '⚽',
 getValue: (data) => data?.total_goals_scored || 0,
 color: 'success'
 },
 {
 key: 'assists',
 label: 'Assists',
 icon: '🎯',
 getValue: (data) => data?.total_assists || 0,
 color: 'accent'
 },
 {
 key: 'shots_on_target',
 label: 'Shots on Target',
 icon: '🎪',
 getValue: (data) => data?.shots_on_target || 0,
 color: 'primary'
 }
 ]
 }
}

/**
 * Get position display name with emoji
 */
export function getPositionDisplay(position: string | null | undefined): string {
 const category = getPositionCategory(position)

 const displays: Record<string, string> = {
 'Goalkeeper': '🧤 Goalkeeper',
 'Defender': '🛡️ Defender',
 'Midfielder': '⚡ Midfielder',
 'Forward': '⚽ Forward'
 }

 return displays[category] || '⚽ Player'
}

/**
 * Calculate player rating from available stats (simple algorithm)
 */
export function calculatePlayerRating(playerData: any, position: string | null | undefined): number {
 const category = getPositionCategory(position)
 const matches = playerData?.total_matches_played || 0

 if (matches === 0) return 0

 const goals = playerData?.total_goals_scored || 0
 const assists = playerData?.total_assists || 0

 let rating = 6.0 // Base rating

 switch (category) {
 case 'Goalkeeper':
 // GK rating based on clean sheets
 const cleanSheets = playerData?.clean_sheets || 0
 rating += (cleanSheets / matches) * 2
 break

 case 'Defender':
 // Defender rating: fewer cards = better
 const yellowCards = playerData?.yellow_cards || 0
 const redCards = playerData?.red_cards || 0
 rating += Math.max(0, 2 - (yellowCards / matches) * 0.5 - (redCards / matches) * 2)
 break

 case 'Midfielder':
 // Midfielder rating: balanced between goals and assists
 rating += (goals / matches) * 0.3 + (assists / matches) * 0.4
 break

 case 'Forward':
 // Forward rating: heavily weighted on goals
 rating += (goals / matches) * 0.5 + (assists / matches) * 0.2
 break
 }

 // Cap rating between 0 and 10
 return Math.min(10, Math.max(0, rating))
}

/**
 * Get form trend from recent performance (placeholder for now)
 */
export function getFormTrend(playerData: any): 'up' | 'down' | 'stable' {
 // In the future, this will analyze recent match performance
 // For now, return stable
 return 'stable'
}

/**
 * Get form emoji
 */
export function getFormEmoji(trend: 'up' | 'down' | 'stable'): string {
 const emojis = {
 up: '📈',
 down: '📉',
 stable: '➡️'
 }
 return emojis[trend]
}
