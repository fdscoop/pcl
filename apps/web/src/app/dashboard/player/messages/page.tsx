'use client'

import { useEffect, useMemo, useState } from 'react'
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
 sendMessage,
 MessageWithSenderInfo
} from '@/services/messageService'

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
 const clubSample = messages.find((msg) => msg.club_name || msg.club_logo)
 const otherPartyName =
 otherPartyType === 'club_owner'
 ? clubSample?.club_name || 'Club'
 : sample.sender_name || 'Player'
 const otherPartyLogo =
 otherPartyType === 'club_owner'
 ? clubSample?.club_logo
 : sample.sender_photo
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
 }

 return (
 <div className="p-4 sm:p-6 lg:p-8">
 {/* Main Content */}
 <div className="max-w-7xl mx-auto">
 {/* Header */}
 <div className="mb-8">
 <div className="flex items-center justify-between gap-4 mb-3">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-3xl shadow-xl shadow-orange-500/30">
 💬
 </div>
 <div>
 <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
 Messages
 {threads.filter(t => t.unreadCount > 0).length > 0 && (
 <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white animate-pulse px-3 py-1 text-sm font-bold rounded-full shadow-lg">
 {threads.reduce((sum, t) => sum + t.unreadCount, 0)} new
 </Badge>
 )}
 </h1>
 <p className="text-lg text-slate-600 mt-1">Review club communications and reply when needed.</p>
 </div>
 </div>
 <Button
 variant="outline"
 onClick={() => userId && loadMessages(userId)}
 disabled={loading}
 className="border-2 border-orange-200 font-bold rounded-xl hover:bg-orange-50 px-5 py-3"
 >
 {loading ? '⏳' : '🔄'} Refresh
 </Button>
 </div>
 </div>

 {error && (
 <Card className="mb-6 border-2 border-red-300 bg-red-50 rounded-2xl shadow-lg">
 <CardContent className="py-5 px-6 text-red-700 font-medium text-base flex items-center gap-3">
 <span className="text-2xl">⚠️</span> {error}
 </CardContent>
 </Card>
 )}
 {successMessage && (
 <Card className="mb-6 border-2 border-emerald-300 bg-emerald-50 rounded-2xl shadow-lg">
 <CardContent className="py-5 px-6 text-emerald-700 font-medium text-base flex items-center gap-3">
 <span className="text-2xl">✅</span> {successMessage}
 </CardContent>
 </Card>
 )}
 <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
 <Card className="border-2 border-orange-200 bg-white rounded-2xl shadow-xl shadow-orange-500/10 overflow-hidden">
 <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-100 py-5 px-6">
 <CardTitle className="text-xl font-bold text-slate-800">📥 Conversations</CardTitle>
 <CardDescription className="text-base">Your latest club threads</CardDescription>
 </CardHeader>
 <CardContent className="space-y-3 max-h-[560px] overflow-auto p-4 bg-gradient-to-b from-white to-orange-50/30">
 {loading ? (
 <div className="flex flex-col items-center justify-center py-12">
 <div className="relative">
 <div className="w-12 h-12 rounded-full border-4 border-orange-200"></div>
 <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
 </div>
 <p className="mt-4 text-slate-600 font-medium">Loading messages...</p>
 </div>
 ) : threads.length === 0 ? (
 <div className="text-center py-12">
 <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-3xl">
 📭
 </div>
 <p className="text-lg font-medium text-slate-700">No conversations yet</p>
 <p className="text-sm text-slate-500 mt-1">Messages from clubs will appear here</p>
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

 <Card className="border-2 border-orange-200 bg-white rounded-2xl shadow-xl shadow-orange-500/10 overflow-hidden">
 <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-100 py-5 px-6">
 <CardTitle className="text-xl font-bold text-slate-800">💬 Conversation</CardTitle>
 <CardDescription className="text-base">
 {selectedThread
 ? `Chat with ${selectedThread.otherPartyName}`
 : 'Select a conversation to view details'}
 </CardDescription>
 </CardHeader>
 <CardContent className="p-5">
 {selectedThread ? (
 <div className="space-y-5">
 <div className="space-y-4 max-h-[400px] overflow-auto scroll-smooth rounded-xl bg-gradient-to-b from-slate-50 to-orange-50/30 p-4 border-2 border-slate-100" id="message-container">
 {selectedThread.messages.map((message) => (
 <MessageBubble
 key={message.id}
 message={message}
 otherPartyName={selectedThread.otherPartyName}
 otherPartyLogo={selectedThread.otherPartyLogo}
 playerPhotoUrl={playerPhotoUrl}
 />
 ))}

 {/* Add a small bottom spacer when the latest message is outgoing (player) */}
 {selectedThread.messages.length > 0 &&
 selectedThread.messages[selectedThread.messages.length - 1].direction === 'out' && (
 <div className="h-6" />
 )}
 </div>

 <div className="space-y-4 p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
 <label className="text-base font-bold text-slate-800 flex items-center gap-2">
 ✍️ Reply
 </label>
 <textarea
 className="w-full min-h-[120px] rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
 placeholder="Write your response..."
 value={replyContent}
 onChange={(event) => setReplyContent(event.target.value)}
 />
 <Button
 disabled={sending || !replyContent.trim()}
 onClick={handleSendReply}
 className={`w-full font-bold py-4 text-lg rounded-xl transition-all shadow-lg ${
 sending || !replyContent.trim()
 ? 'bg-slate-400 cursor-not-allowed'
 : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/30'
 }`}
 >
 {sending ? '⏳ Sending...' : '📤 Send Reply'}
 </Button>
 </div>
 </div>
 ) : (
 <div className="text-center py-16">
 <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-4xl shadow-lg">
 💬
 </div>
 <h3 className="text-xl font-bold text-slate-800 mb-2">Select a Conversation</h3>
 <p className="text-base text-slate-600">
 Choose a conversation from the list to view the full thread.
 </p>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 )
}
