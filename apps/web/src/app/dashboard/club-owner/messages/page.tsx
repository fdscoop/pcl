'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ThreadItem from '@/components/messages/ThreadItem'
import ThreadItemSkeleton from '@/components/messages/ThreadItemSkeleton'
import ConversationSkeleton from '@/components/messages/ConversationSkeleton'
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

export default function ClubOwnerMessagesPage() {
  const router = useRouter()
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null)
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
      const playerSample = messages.find((msg) => msg.sender_name || msg.sender_photo)
      const otherPartyName =
        otherPartyType === 'club_owner'
          ? clubSample?.club_name || 'Club'
          : playerSample?.sender_name || sample.sender_name || 'Player'
      const otherPartyLogo =
        otherPartyType === 'club_owner'
          ? clubSample?.club_logo
          : playerSample?.sender_photo || sample.sender_photo
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

  const loadMessages = async (id: string, isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true)
    } else {
      setLoading(true)
    }
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
      if (isInitial) {
        setInitialLoading(false)
      } else {
        setLoading(false)
      }
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
      const { data: clubData } = await supabase
        .from('clubs')
        .select('logo_url, kyc_verified')
        .eq('owner_id', user.id)
        .maybeSingle()

      // Check KYC verification status
      if (clubData && !clubData.kyc_verified) {
        router.replace('/dashboard/club-owner/kyc')
        return
      }

      setClubLogoUrl(clubData?.logo_url || null)
      await loadMessages(user.id, true)
    }

    loadUser()
  }, [router])

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel('club_messages_realtime')
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
    <div className="min-h-screen">
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-600 font-medium mb-1">welcome back 👋</p>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                Messages
                {threads.filter(t => t.unreadCount > 0).length > 0 && (
                  <Badge variant="destructive" className="animate-pulse text-sm px-3 py-1">
                    {threads.reduce((sum, t) => sum + t.unreadCount, 0)} new
                  </Badge>
                )}
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => userId && loadMessages(userId)}
                disabled={loading}
                className="px-6 py-2 text-sm bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50/50 backdrop-blur-sm px-5 py-4 shadow-md">
            <p className="text-red-700 font-medium flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              {error}
            </p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 rounded-xl border-2 border-green-200 bg-green-50/50 backdrop-blur-sm px-5 py-4 shadow-md">
            <p className="text-green-700 font-medium flex items-center gap-2">
              <span className="text-xl">✓</span>
              {successMessage}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Conversations List */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Conversations</h2>
              <p className="text-teal-50 text-sm mt-1">Your latest player threads</p>
            </div>
            <div className="px-4 py-3 space-y-2 max-h-[calc(100vh-280px)] overflow-auto bg-gradient-to-b from-sky-50/20 to-transparent">
              {initialLoading ? (
                <>
                  <ThreadItemSkeleton />
                  <ThreadItemSkeleton />
                  <ThreadItemSkeleton />
                  <ThreadItemSkeleton />
                </>
              ) : threads.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">💬</div>
                  <p className="text-sm font-semibold text-gray-700">No conversations yet</p>
                  <p className="text-xs text-gray-500 mt-2">Messages from players will appear here</p>
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
            </div>
          </div>

          {/* Conversation Detail */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Conversation</h2>
              <p className="text-teal-50 text-sm mt-1">
                {selectedThread
                  ? `Chat with ${selectedThread.otherPartyName}`
                  : 'Select a conversation to view details'}
              </p>
            </div>
            <div className="px-6 py-5">
              {initialLoading ? (
                <ConversationSkeleton />
              ) : selectedThread ? (
                <div className="space-y-5">
                  <div className="space-y-4 max-h-[calc(100vh-480px)] overflow-auto scroll-smooth pr-2" id="message-container">
                    {selectedThread.messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        otherPartyName={selectedThread.otherPartyName}
                        otherPartyLogo={selectedThread.otherPartyLogo}
                        selfAvatarUrl={clubLogoUrl}
                      />
                    ))}

                    {/* Add a small bottom spacer when the latest message is outgoing (club) */}
                    {selectedThread.messages.length > 0 &&
                      selectedThread.messages[selectedThread.messages.length - 1].direction === 'out' && (
                        <div className="h-6" />
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t-2 border-slate-200">
                    <label className="text-sm font-bold text-gray-900">Reply</label>
                    <textarea
                      className="w-full min-h-[120px] rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                      placeholder="Write your response..."
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                    />
                    <button
                      disabled={sending || !replyContent.trim()}
                      onClick={handleSendReply}
                      className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📨</div>
                  <p className="text-base font-semibold text-gray-700">Select a conversation</p>
                  <p className="text-sm text-gray-500 mt-2">Choose a thread from the left to view messages</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
