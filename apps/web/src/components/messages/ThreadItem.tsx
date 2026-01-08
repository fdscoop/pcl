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

interface Props {
 thread: any
 selected: boolean
 onSelect: (thread: any) => void
}

export default function ThreadItem({ thread, selected, onSelect }: Props) {
 const tone: Tone = getToneForThread(thread)
 const hasUnread = thread.unreadCount > 0
 const incomingLabel =
 thread.otherPartyType === 'club_owner'
 ? 'Club:'
 : thread.otherPartyType === 'player'
 ? 'Player:'
 : 'Message:'

 return (
 <button
 type="button"
 onClick={() => onSelect(thread)}
 className={`w-full text-left rounded-2xl px-3 py-2 transition-all duration-200 shadow-sm border ${
 hasUnread
 ? 'border-destructive/50 bg-destructive/10 hover:bg-destructive/15 shadow-destructive/20 shadow-md'
 : `${tone.border} ${tone.gradient} ${tone.hover}`
 } ${
 selected ? `${hasUnread ? 'bg-destructive/20 border-destructive' : tone.selected} shadow-md` : ''
 } my-2`}
 >
 <div className={`h-0.5 w-full rounded-t-2xl ${
 hasUnread
 ? 'bg-destructive'
 : selected ? tone.selected : tone.base
 }`} />
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 {thread.otherPartyLogo ? (
 <img
 src={thread.otherPartyLogo}
 alt={thread.otherPartyName}
 className={`h-8 w-8 rounded-full object-cover shadow-sm ${
 hasUnread ? 'ring-2 ring-destructive/50' : ''
 }`}
 />
 ) : (
 <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-slate-600 shadow-sm ${
 hasUnread ? 'ring-2 ring-destructive/50' : ''
 }`}>
 {getInitials(thread.otherPartyName)}
 </div>
 )}
 <span className={`font-semibold text-sm ${
 hasUnread ? 'text-destructive' : tone.title
 } line-clamp-1`}>
 {thread.otherPartyName}
 </span>
 </div>
 {hasUnread && (
 <Badge variant="destructive" className="animate-pulse">
 {thread.unreadCount}
 </Badge>
 )}
 </div>
 <div className="mt-1 flex items-start justify-between">
 <div className="flex-1 pr-3" />
 <div className="text-right text-sm max-w-[48%]">
 <div className="flex items-center justify-end text-sm">
 <span className={`font-semibold ${
 hasUnread && thread.latestMessage.direction === 'in'
 ? 'text-destructive'
 : thread.latestMessage.direction === 'out'
 ? 'text-amber-600'
 : 'text-sky-700'
 } mr-2`}>
 {thread.latestMessage.direction === 'out' ? 'You:' : incomingLabel}
 </span>
 <span className={`${
 hasUnread ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'
 } line-clamp-1 truncate max-w-[180px]`}>
 {thread.latestMessage.content}
 </span>
 </div>
 <div className={`mt-1 text-sm ${
 hasUnread ? 'text-destructive font-medium' : 'text-muted-foreground'
 }`}>
 {new Date(thread.latestMessage.created_at).toLocaleDateString()}
 </div>
 </div>
 </div>
 </button>
 )
}
