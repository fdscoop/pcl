'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Eye, MessageCircle, FileText } from 'lucide-react'

interface PlayerCardProps {
 player: {
 id: string
 unique_player_id: string
 photo_url?: string | null
 position?: string
 state?: string | null
 district?: string | null
 nationality?: string
 total_matches_played: number
 total_goals_scored: number
 total_assists: number
 is_available_for_scout: boolean
 users?: {
 first_name: string
 last_name: string
 bio?: string | null
 }
 }
 onView: () => void
 onMessage: () => void
 onContract: () => void
}

// Position-based colors
const getPositionColors = (position?: string) => {
 switch (position?.toLowerCase()) {
 case 'goalkeeper':
 return {
 gradient: 'from-yellow-500 to-amber-600',
 badge: 'bg-yellow-500',
 ring: 'ring-yellow-400/50'
 }
 case 'defender':
 return {
 gradient: 'from-blue-500 to-blue-600',
 badge: 'bg-blue-500',
 ring: 'ring-blue-400/50'
 }
 case 'midfielder':
 return {
 gradient: 'from-green-500 to-emerald-600',
 badge: 'bg-green-500',
 ring: 'ring-green-400/50'
 }
 case 'forward':
 return {
 gradient: 'from-red-500 to-rose-600',
 badge: 'bg-red-500',
 ring: 'ring-red-400/50'
 }
 default:
 return {
 gradient: 'from-purple-500 to-indigo-600',
 badge: 'bg-purple-500',
 ring: 'ring-purple-400/50'
 }
 }
}

export default function CompactPlayerCard({
 player,
 onView,
 onMessage,
 onContract
}: PlayerCardProps) {
 const [imageError, setImageError] = useState(false)
 const colors = getPositionColors(player.position)

 return (
 <div className={`relative overflow-hidden rounded-2xl shadow-xl aspect-[3/4] group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:ring-4 ${colors.ring}`}>
 {/* Background Image */}
 <div className="absolute inset-0">
 {player.photo_url && !imageError ? (
 <Image
 src={player.photo_url}
 alt={`${player.users?.first_name} ${player.users?.last_name}`}
 fill
 className="object-cover"
 onError={() => setImageError(true)}
 />
 ) : (
 <div className={`w-full h-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
 <span className="text-6xl">⚽</span>
 </div>
 )}

 {/* Gradient Overlay */}
 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
 </div>

 {/* Position Badge - Top Right */}
 <div className="absolute top-3 right-3 z-20">
 <div className={`${colors.badge} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform transition-all duration-200 group-hover:scale-110`}>
 {player.position}
 </div>
 </div>

 {/* Availability Badge - Top Left */}
 {player.is_available_for_scout && (
 <div className="absolute top-3 left-3 z-20">
 <div className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-green-600 animate-pulse">
 <span>✓</span>
 <span>Available</span>
 </div>
 </div>
 )}

 {/* Info Section - Bottom */}
 <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
 {/* Name */}
 <h3 className="text-lg font-bold text-white mb-1 drop-shadow-lg line-clamp-2">
 {player.users?.first_name} {player.users?.last_name}
 </h3>

 {/* Location */}
 <p className="text-sm text-white/90 mb-3 drop-shadow line-clamp-1">
 📍 {player.district && player.state 
 ? `${player.district}, ${player.state}` 
 : player.state || 'Location TBD'}
 </p>

 {/* Bio */}
 {player.users?.bio && (
 <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 mb-3 border border-white/20 line-clamp-2">
 <p className="text-xs text-white/90 drop-shadow">
 {player.users?.bio}
 </p>
 </div>
 )}

 {/* Stats Box */}
 <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 mb-3 border border-white/20">
 <div className="grid grid-cols-3 gap-2 text-center">
 <div>
 <div className="text-lg font-bold text-blue-300">{player.total_matches_played}</div>
 <div className="text-[10px] text-white/80">Matches</div>
 </div>
 <div>
 <div className="text-lg font-bold text-green-300">{player.total_goals_scored}</div>
 <div className="text-[10px] text-white/80">Goals</div>
 </div>
 <div>
 <div className="text-lg font-bold text-yellow-300">{player.total_assists}</div>
 <div className="text-[10px] text-white/80">Assists</div>
 </div>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="grid grid-cols-3 gap-2">
 <Button
 variant="outline"
 size="sm"
 className="text-xs h-9 bg-white/90 hover:bg-white border-white/70 hover:border-white text-slate-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5"
 onClick={onView}
 title="View full details"
 >
 <Eye className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">View</span>
 </Button>
 <Button
 className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-xs h-9 font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5"
 size="sm"
 onClick={onMessage}
 title="Send message"
 >
 <MessageCircle className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Chat</span>
 </Button>
 <Button
 variant="outline"
 size="sm"
 className="text-xs h-9 bg-white/90 hover:bg-white border-white/70 hover:border-white text-slate-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5"
 onClick={onContract}
 title="Issue contract"
 >
 <FileText className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Sign</span>
 </Button>
 </div>
 </div>

 {/* PCL Watermark */}
 <div className="absolute bottom-20 left-0 right-0 pointer-events-none overflow-hidden z-10">
 <div className="text-5xl font-black text-white/5 leading-none">
 PCL
 </div>
 </div>
 </div>
 )
}
