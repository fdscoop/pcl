'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ThreadItem from '@/components/messages/ThreadItem'
import MessageBubble from '@/components/messages/MessageBubble'
import {
 getInboxMessages,
 getSentMessages,
 markMessageAsRead,
 MessageWithSenderInfo
} from '@/services/messageService'
import { sendMessageWithPush as sendMessage } from '@/services/messageServiceWithPush'

type MessageDirection = 'in' | 'out'

type ThreadMessage = MessageWithSenderInfo & {
 direction: MessageDirection
}

type ThreadSummary = {
 key: string
 otherPartyId: string
 otherPartyType: 'club_owner' | 'player'
 otherPartyName: string
 otherPartyLogo?: string
 latestMessage: ThreadMessage
 unreadCount: number
 messages: ThreadMessage[]
}

// tone helper moved to components/messages/tone.ts

export default function PlayerMessagesPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(true)
 const [sending, setSending] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [userId, setUserId] = useState<string | null>(null)
 const [playerPhotoUrl, setPlayerPhotoUrl] = useState<string | null>(null)
 const [inboxMessages, setInboxMessages] = useState<MessageWithSenderInfo[]>([])
 const [sentMessages, setSentMessages] = useState<MessageWithSenderInfo[]>([])
 const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null)
 const [replyContent, setReplyContent] = useState('')
 const [successMessage, setSuccessMessage] = useState<string | null>(null)
 // Mobile view state: 'list' shows conversations list, 'chat' shows conversation detail
 const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
 const messageContainerRef = useRef<HTMLDivElement>(null)

 const threads = useMemo<ThreadSummary[]>(() => {
 const combined: ThreadMessage[] = [
 ...inboxMessages.map((message) => ({ ...message, direction: 'in' as const })),
 ...sentMessages.map((message) => ({ ...message, direction: 'out' as const }))
 ]

 const grouped = new Map<string, ThreadMessage[]>()

 combined.forEach((message) => {
 const otherPartyId = message.direction === 'in' ? message.sender_id : message.receiver_id
 const otherPartyType = message.direction === 'in' ? message.sender_type : message.receiver_type
 const key = `${otherPartyType}:${otherPartyId}`

 if (!grouped.has(key)) {
 grouped.set(key, [])
 }
 grouped.get(key)!.push(message)
 })

 const summaries: ThreadSummary[] = []

 grouped.forEach((messages, key) => {
 const sorted = [...messages].sort(
 (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
 )
 const latestMessage = sorted[sorted.length - 1]
 const sample = latestMessage
 const otherPartyId = sample.direction === 'in' ? sample.sender_id : sample.receiver_id
 const otherPartyType = sample.direction === 'in' ? sample.sender_type : sample.receiver_type
 
 // Find the most relevant message with sender info
 const messageWithSenderInfo = messages.find((msg) => 
 (msg.club_name && msg.club_name !== 'Unknown') || (msg.sender_name && msg.sender_name !== 'Unknown')
 ) || messages.find((msg) => msg.club_name || msg.sender_name) || sample

 const otherPartyName = otherPartyType === 'club_owner'
 ? messageWithSenderInfo.club_name || 'Club'
 : messageWithSenderInfo.sender_name || 'Player'
 
 const otherPartyLogo = otherPartyType === 'club_owner'
 ? messageWithSenderInfo.club_logo || undefined
 : messageWithSenderInfo.sender_photo || undefined
 
 const unreadCount = sorted.filter(
 (message) => message.direction === 'in' && !message.is_read
 ).length

 summaries.push({
 key,
 otherPartyId,
 otherPartyType,
 otherPartyName,
 otherPartyLogo,
 latestMessage,
 unreadCount,
 messages: sorted
 })
 })

 return summaries.sort(
 (a, b) =>
 new Date(b.latestMessage.created_at).getTime() -
 new Date(a.latestMessage.created_at).getTime()
 )
 }, [inboxMessages, sentMessages])

 const selectedThread = useMemo(
 () => threads.find((thread) => thread.key === selectedThreadKey) || null,
 [threads, selectedThreadKey]
 )

 const loadMessages = async (id: string) => {
 setLoading(true)
 setError(null)
 setSuccessMessage(null)

 try {
 const [inboxResult, sentResult] = await Promise.all([
 getInboxMessages(id),
 getSentMessages(id)
 ])

 if (inboxResult.error || sentResult.error) {
 setError(inboxResult.error || sentResult.error || 'Failed to load messages')
 }

 setInboxMessages(inboxResult.messages || [])
 setSentMessages(sentResult.messages || [])
 setReplyContent('')
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to load messages')
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 const loadUser = async () => {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 router.push('/auth/login')
 return
 }

 setUserId(user.id)
 const { data: playerData } = await supabase
 .from('players')
 .select('photo_url')
 .eq('user_id', user.id)
 .maybeSingle()

 setPlayerPhotoUrl(playerData?.photo_url || null)
 await loadMessages(user.id)
 }

 loadUser()
 }, [router])

 // Subscribe to real-time message updates
 useEffect(() => {
 if (!userId) return

 const supabase = createClient()
 const channel = supabase
 .channel('player_messages_realtime')
 .on(
 'postgres_changes',
 {
 event: 'INSERT',
 schema: 'public',
 table: 'messages',
 filter: `receiver_id=eq.${userId}`
 },
 () => {
 loadMessages(userId)
 }
 )
 .on(
 'postgres_changes',
 {
 event: 'UPDATE',
 schema: 'public',
 table: 'messages',
 filter: `receiver_id=eq.${userId}`
 },
 () => {
 loadMessages(userId)
 }
 )
 .on(
 'postgres_changes',
 {
 event: 'INSERT',
 schema: 'public',
 table: 'messages',
 filter: `sender_id=eq.${userId}`
 },
 () => {
 loadMessages(userId)
 }
 )
 .subscribe()

 return () => {
 supabase.removeChannel(channel)
 }
 }, [userId])

 useEffect(() => {
 if (threads.length === 0) {
 setSelectedThreadKey(null)
 return
 }

 if (!selectedThreadKey || !threads.some((thread) => thread.key === selectedThreadKey)) {
 setSelectedThreadKey(threads[0].key)
 }
 }, [threads, selectedThreadKey])

 const handleSelectThread = async (thread: ThreadSummary) => {
 setSelectedThreadKey(thread.key)
 setSuccessMessage(null)
 // Switch to chat view on mobile when selecting a thread
 setMobileView('chat')

 const unreadMessages = thread.messages.filter(
 (message) => message.direction === 'in' && !message.is_read
 )

 if (unreadMessages.length > 0) {
 const updates = await Promise.all(
 unreadMessages.map((message) => markMessageAsRead(message.id))
 )

 if (updates.some(Boolean)) {
 setInboxMessages((prev) =>
 prev.map((item) =>
 unreadMessages.some((message) => message.id === item.id)
 ? { ...item, is_read: true }
 : item
 )
 )
 }
 }
 
 // Scroll to bottom of messages after a short delay
 setTimeout(() => {
 if (messageContainerRef.current) {
 messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
 }
 }, 100)
 }

 const handleSendReply = async () => {
 if (!selectedThread || !replyContent.trim()) {
 return
 }

 setSending(true)
 setError(null)

 const latestSubject = selectedThread.latestMessage.subject
 const subject = latestSubject ? `Re: ${latestSubject}` : undefined

 const result = await sendMessage({
 receiverId: selectedThread.otherPartyId,
 receiverType: selectedThread.otherPartyType,
 subject,
 content: replyContent.trim()
 })

 if (!result.success) {
 setError(result.error || 'Failed to send reply')
 setSending(false)
 return
 }

 setReplyContent('')
 if (userId) {
 await loadMessages(userId)
 }
 setSuccessMessage('Reply sent.')
 setSending(false)
 
 // Scroll to bottom after sending
 setTimeout(() => {
 if (messageContainerRef.current) {
 messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
 }
 }, 100)
 }

 // Helper to go back to list view on mobile
 const handleBackToList = () => {
 setMobileView('list')
 }

 return (
 <div className="bg-slate-50/50 flex flex-col lg:h-[100dvh] lg:overflow-hidden">
 <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-2 sm:px-6 lg:px-8 py-2 sm:py-4 lg:overflow-hidden">
 {/* Header - Compact on mobile, hidden when in chat view */}
 <div className={`shrink-0 mb-2 sm:mb-4 ${mobileView === 'chat' ? 'hidden lg:block' : ''}`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-orange-500/20">
 💬
 </div>
 <div>
 <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
 Messages
 {threads.filter(t => t.unreadCount > 0).length > 0 && (
 <Badge className="bg-red-500 text-white animate-pulse text-xs px-1.5 py-0.5 rounded-full">
 {threads.reduce((sum, t) => sum + t.unreadCount, 0)}
 </Badge>
 )}
 </h1>
 <p className="text-xs sm:text-sm text-slate-500">Club communications</p>
 </div>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => userId && loadMessages(userId)}
 disabled={loading}
 className="border-orange-200 hover:bg-orange-50 p-2"
 aria-label="Refresh"
 >
 {loading ? (
 <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 ) : '🔄'}
 </Button>
 </div>
 </div>

 {/* Error/Success Messages - Compact */}
 {error && (
 <div className={`shrink-0 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 ${mobileView === 'chat' ? 'hidden lg:block' : ''}`}>
 <p className="text-red-700 font-medium flex items-center gap-2 text-xs sm:text-sm">
 ⚠️ {error}
 </p>
 </div>
 )}
 {successMessage && (
 <div className={`shrink-0 mb-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 ${mobileView === 'chat' ? 'hidden lg:block' : ''}`}>
 <p className="text-green-700 font-medium flex items-center gap-2 text-xs sm:text-sm">
 ✓ {successMessage}
 </p>
 </div>
 )}

 {/* Desktop: Side-by-side layout | Mobile: Full height toggle */}
 <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-3 sm:gap-4 min-h-0">
 {/* Conversations List - Full height on mobile */}
 <Card className={`flex flex-col border-orange-200 bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden min-h-0 ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
 <CardHeader className="shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 sm:py-3 px-3 sm:px-4">
 <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
 📥 Conversations
 </CardTitle>
 <CardDescription className="text-orange-100 text-xs">Your club threads</CardDescription>
 </CardHeader>
 <CardContent className="flex-1 overflow-auto p-2 space-y-1.5 bg-gradient-to-b from-orange-50/30 to-transparent">
 {loading ? (
 <div className="flex flex-col items-center justify-center py-8">
 <div className="relative">
 <div className="w-10 h-10 rounded-full border-4 border-orange-200"></div>
 <div className="w-10 h-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
 </div>
 <p className="mt-3 text-slate-600 font-medium text-sm">Loading...</p>
 </div>
 ) : threads.length === 0 ? (
 <div className="text-center py-8">
 <div className="text-3xl mb-2">📭</div>
 <p className="text-sm font-medium text-slate-600">No conversations yet</p>
 <p className="text-xs text-slate-400 mt-1">Messages will appear here</p>
 </div>
 ) : (
 threads.map((thread) => (
 <ThreadItem
 key={thread.key}
 thread={thread}
 selected={selectedThreadKey === thread.key}
 onSelect={handleSelectThread}
 />
 ))
 )}
 </CardContent>
 </Card>

 {/* Conversation Detail - Full height on mobile */}
 <Card className={`flex flex-col border-orange-200 bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden min-h-0 ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
 {/* Chat Header */}
 <CardHeader className="shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 py-2 sm:py-3 px-3 sm:px-4">
 <div className="flex items-center gap-2 sm:gap-3">
 {/* Back button - Mobile only */}
 <button
 onClick={handleBackToList}
 className="lg:hidden flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
 aria-label="Back to conversations"
 >
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
 </svg>
 </button>
 {/* Avatar */}
 {selectedThread && (
 <div className="shrink-0">
 {selectedThread.otherPartyLogo ? (
 <img
 src={selectedThread.otherPartyLogo}
 alt={selectedThread.otherPartyName}
 className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white/30"
 />
 ) : (
 <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
 {selectedThread.otherPartyName.slice(0, 2).toUpperCase()}
 </div>
 )}
 </div>
 )}
 <div className="flex-1 min-w-0">
 <CardTitle className="text-sm sm:text-base font-bold text-white truncate">
 {selectedThread ? selectedThread.otherPartyName : 'Conversation'}
 </CardTitle>
 <CardDescription className="text-orange-100 text-xs truncate">
 {selectedThread ? 'Tap to view profile' : 'Select a chat'}
 </CardDescription>
 </div>
 {/* Refresh button in chat header for mobile */}
 <button
 onClick={() => userId && loadMessages(userId)}
 disabled={loading}
 className="lg:hidden p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
 aria-label="Refresh"
 >
 {loading ? (
 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 ) : (
 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
 </svg>
 )}
 </button>
 </div>
 </CardHeader>

 {/* Messages Area */}
 <CardContent className="flex-1 flex flex-col min-h-0 p-2 sm:p-4">
 {selectedThread ? (
 <>
 {/* Messages Container */}
 <div 
 ref={messageContainerRef}
 className="flex-1 overflow-auto space-y-2 sm:space-y-3 pr-1 scroll-smooth"
 >
 {selectedThread.messages.map((message) => (
 <MessageBubble
 key={message.id}
 message={message}
 otherPartyName={selectedThread.otherPartyName}
 otherPartyLogo={selectedThread.otherPartyLogo}
 playerPhotoUrl={playerPhotoUrl}
 />
 ))}
 </div>

 {/* Reply Input - Compact on mobile */}
 <div className="shrink-0 pt-2 sm:pt-3 border-t border-orange-100 mt-2">
 <div className="flex gap-2 items-end">
 <textarea
 className="flex-1 min-h-[40px] max-h-[100px] rounded-xl border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all resize-none"
 placeholder="Type a message..."
 value={replyContent}
 onChange={(event) => setReplyContent(event.target.value)}
 rows={1}
 />
 <button
 disabled={sending || !replyContent.trim()}
 onClick={handleSendReply}
 className="shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
 aria-label="Send message"
 >
 {sending ? (
 <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 ) : (
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
 <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
 </svg>
 )}
 </button>
 </div>
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
 <div className="text-4xl sm:text-5xl mb-3">�</div>
 <p className="text-sm sm:text-base font-medium text-slate-600">Select a conversation</p>
 <p className="text-xs text-slate-400 mt-1">Choose a chat from the list</p>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 </main>
 </div>
 )
}
