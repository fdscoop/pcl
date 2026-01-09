import React from 'react'
import { getToneForThread } from './tone'

const formatSubject = (subject?: string | null) => {
 if (!subject) return ''
 const cleaned = subject
 .replace(/\bundefined\b/gi, '')
 .replace(/\bmessage from\b/gi, '')
 .replace(/\bre:\s*/gi, '')
 .replace(/\s{2,}/g, ' ')
 .trim()
 return cleaned
}

const getInitials = (name = '') =>
 name
 .split(' ')
 .map((p) => p[0])
 .join('')
 .slice(0, 2)
 .toUpperCase()

// Format time for message
const formatMessageTime = (dateString: string) => {
 const date = new Date(dateString)
 const now = new Date()
 const isToday = date.toDateString() === now.toDateString()
 const yesterday = new Date(now)
 yesterday.setDate(yesterday.getDate() - 1)
 const isYesterday = date.toDateString() === yesterday.toDateString()
 
 const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
 
 if (isToday) return timeStr
 if (isYesterday) return `Yesterday ${timeStr}`
 return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + timeStr
}

interface Props {
 message: any
 otherPartyName?: string
 otherPartyLogo?: string | null
 playerPhotoUrl?: string | null
 selfAvatarUrl?: string | null
}

export default function MessageBubble({
 message,
 otherPartyName,
 otherPartyLogo,
 playerPhotoUrl,
 selfAvatarUrl
}: Props) {
 const isOut = message.direction === 'out'
 const selfImage = selfAvatarUrl ?? playerPhotoUrl

 return (
 <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
 <div className={`flex items-end gap-1.5 sm:gap-2 max-w-[85%] sm:max-w-[75%] ${isOut ? 'flex-row-reverse' : ''}`}>
 {/* Avatar - Hidden on very small screens for sent messages */}
 <div className={`shrink-0 ${isOut ? 'hidden sm:block' : ''}`}>
 {isOut ? (
 selfImage ? (
 <img src={selfImage} alt="You" className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover" />
 ) : (
 <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-teal-500 text-[10px] sm:text-xs font-semibold text-white">
 {getInitials('You')}
 </div>
 )
 ) : otherPartyLogo ? (
 <img src={otherPartyLogo} alt={otherPartyName} className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover" />
 ) : (
 <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-[10px] sm:text-xs font-semibold text-white">
 {getInitials(otherPartyName || '')}
 </div>
 )}
 </div>

 {/* Message Bubble */}
 <div className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 ${
 isOut
 ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-br-md'
 : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
 }`}>
 {/* Message content */}
 <p className="text-sm sm:text-[15px] whitespace-pre-wrap break-words leading-relaxed">
 {message.content}
 </p>
 
 {/* Time and read status */}
 <div className={`flex items-center justify-end gap-1 mt-1 ${
 isOut ? 'text-teal-100' : 'text-slate-400'
 }`}>
 <span className="text-[10px] sm:text-xs">
 {formatMessageTime(message.created_at)}
 </span>
 {isOut && (
 message.is_read ? (
 <svg
 xmlns="http://www.w3.org/2000/svg"
 viewBox="0 0 24 24"
 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-200"
 fill="none"
 stroke="currentColor"
 strokeWidth={2.5}
 aria-label="Read"
 >
 <title>Read</title>
 <path d="M1.5 12.5l4 4L10.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
 <path d="M7.5 12.5l4 4L18.5 9.5" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 ) : (
 <svg
 xmlns="http://www.w3.org/2000/svg"
 viewBox="0 0 24 24"
 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-200/60"
 fill="none"
 stroke="currentColor"
 strokeWidth={2.5}
 aria-label="Sent"
 >
 <title>Sent</title>
 <path d="M4.5 12.5l5 5L17.5 9.5" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 )
 )}
 </div>
 </div>
 </div>
 </div>
 )
}
