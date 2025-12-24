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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              Messages
              {threads.filter(t => t.unreadCount > 0).length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {threads.reduce((sum, t) => sum + t.unreadCount, 0)} new
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">Review club communications and reply when needed.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="btn-lift" onClick={() => router.back()}>
              Back
            </Button>
            <Button
              variant="gradient"
              className="btn-lift"
              onClick={() => userId && loadMessages(userId)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 text-destructive font-medium">
              {error}
            </CardContent>
          </Card>
        )}
        {successMessage && (
          <Card className="mb-6 border-success/30 bg-success/10">
            <CardContent className="py-4 text-success font-medium">
              {successMessage}
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <Card className="border-0 bg-gradient-to-b from-sky-50/10 via-transparent to-primary/5 shadow-xl my-6 bg-card/70">
            <CardHeader className="rounded-t-2xl bg-sky-100/30 border-b border-sky-200/40">
              <CardTitle>Conversations</CardTitle>
              <CardDescription>Your latest club threads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[560px] overflow-auto bg-sky-50/5">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading messages...</div>
              ) : threads.length === 0 ? (
                <div className="text-sm text-muted-foreground">No conversations yet.</div>
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

          <Card className="border-0 bg-gradient-to-b from-primary/10 via-transparent to-accent/5 shadow-xl bg-card/70">
            <CardHeader className="rounded-t-2xl bg-sky-100/30 border-b border-sky-200/40 py-3 my-4">
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                {selectedThread
                  ? `Chat with ${selectedThread.otherPartyName}`
                  : 'Select a conversation to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedThread ? (
                <div className="space-y-4">
                  <div className="space-y-4 max-h-[360px] overflow-auto scroll-smooth" id="message-container">
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

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">Reply</label>
                    <textarea
                      className="w-full min-h-[120px] rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Write your response..."
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                    />
                    <Button
                      variant="gradient"
                      className="btn-lift"
                      disabled={sending || !replyContent.trim()}
                      onClick={handleSendReply}
                    >
                      {sending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Choose a conversation from the list to view the full thread.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
