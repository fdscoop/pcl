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

  const bubbleClass = isOut
    ? 'bg-gradient-to-br from-amber-100 via-amber-50 to-amber-50 text-foreground'
    : 'bg-gradient-to-br from-sky-300/25 via-sky-200/20 to-sky-100/15 text-foreground'

  const headerClass = isOut ? 'bg-amber-100/30 text-foreground gap-4' : 'bg-sky-200/25 text-foreground'

  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-3 ${isOut ? 'flex-row-reverse' : ''}`}>
        {isOut ? (
          selfImage ? (
            <img src={selfImage} alt="You" className="h-9 w-9 rounded-full object-cover shadow-sm" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600 shadow-sm">{getInitials('You')}</div>
          )
        ) : otherPartyLogo ? (
          <img src={otherPartyLogo} alt={otherPartyName} className="h-9 w-9 rounded-full object-cover shadow-sm" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600 shadow-sm">{getInitials(otherPartyName || '')}</div>
        )}

        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md ${bubbleClass}`}>
          <div className={`flex items-center justify-between text-sm mb-2 rounded-md px-2 py-1 ${headerClass}`}>
            <span className="text-sm">{isOut ? 'You' : otherPartyName}</span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs">{new Date(message.created_at).toLocaleString()}</span>
              {isOut && (
                // Use `is_read` boolean from DB schema to show read status
                (message.is_read) ? (
                  // double check (read)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-sky-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-label="Read"
                    title="Read"
                  >
                    <path d="M1.5 13.5l4 4L10.5 13" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5 13.5l4 4L18.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  // single check (sent / unread)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-label="Sent"
                    title="Sent"
                  >
                    <path d="M4 12l3 3L14 8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )
              )}
            </span>
          </div>

          {formatSubject(message.subject) && <div className="font-semibold mb-1">{formatSubject(message.subject)}</div>}
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    </div>
  )
}
