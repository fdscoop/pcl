import React from 'react'
import { Badge } from '@/components/ui/badge'
import { getToneForThread, Tone } from './tone'

const getInitials = (name = '') =>
 name
 .split(' ')
 .map((p) => p[0])
 .join('')
 .slice(0, 2)
 .toUpperCase()

// Format relative time
const getRelativeTime = (dateString: string) => {
 const date = new Date(dateString)
 const now = new Date()
 const diffMs = now.getTime() - date.getTime()
 const diffMins = Math.floor(diffMs / 60000)
 const diffHours = Math.floor(diffMs / 3600000)
 const diffDays = Math.floor(diffMs / 86400000)
 
 if (diffMins < 1) return 'now'
 if (diffMins < 60) return `${diffMins}m`
 if (diffHours < 24) return `${diffHours}h`
 if (diffDays < 7) return `${diffDays}d`
 return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
 thread: any
 selected: boolean
 onSelect: (thread: any) => void
}

export default function ThreadItem({ thread, selected, onSelect }: Props) {
 const tone: Tone = getToneForThread(thread)
 const hasUnread = thread.unreadCount > 0

 return (
 <button
 type="button"
 onClick={() => onSelect(thread)}
 className={`w-full text-left rounded-xl px-2.5 py-2 transition-all duration-150 border ${
 hasUnread
 ? 'border-red-200 bg-red-50/80 hover:bg-red-50'
 : selected
 ? 'border-teal-300 bg-teal-50/80'
 : 'border-transparent bg-white hover:bg-slate-50'
 } ${selected ? 'shadow-sm' : ''}`}
 >
 <div className="flex items-center gap-2.5">
 {/* Avatar */}
 <div className="relative shrink-0">
 {thread.otherPartyLogo ? (
 <img
 src={thread.otherPartyLogo}
 alt={thread.otherPartyName}
 className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover ${
 hasUnread ? 'ring-2 ring-red-400 ring-offset-1' : ''
 }`}
 />
 ) : (
 <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-bold text-white ${
 hasUnread ? 'ring-2 ring-red-400 ring-offset-1' : ''
 }`}>
 {getInitials(thread.otherPartyName)}
 </div>
 )}
 {/* Online indicator or unread dot */}
 {hasUnread && (
 <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
 {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
 </span>
 )}
 </div>
 
 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2">
 <span className={`font-semibold text-sm truncate ${
 hasUnread ? 'text-slate-900' : 'text-slate-700'
 }`}>
 {thread.otherPartyName}
 </span>
 <span className={`text-[11px] shrink-0 ${
 hasUnread ? 'text-red-500 font-semibold' : 'text-slate-400'
 }`}>
 {getRelativeTime(thread.latestMessage.created_at)}
 </span>
 </div>
 <div className="flex items-center gap-1 mt-0.5">
 {thread.latestMessage.direction === 'out' && (
 <span className="text-slate-400 text-xs shrink-0">You:</span>
 )}
 <p className={`text-xs truncate ${
 hasUnread ? 'text-slate-700 font-medium' : 'text-slate-500'
 }`}>
 {thread.latestMessage.content}
 </p>
 </div>
 </div>
 
 {/* Arrow indicator */}
 <svg 
 xmlns="http://www.w3.org/2000/svg" 
 className={`h-4 w-4 shrink-0 ${selected ? 'text-teal-500' : 'text-slate-300'}`}
 fill="none" 
 viewBox="0 0 24 24" 
 stroke="currentColor"
 >
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </div>
 </button>
 )
}
