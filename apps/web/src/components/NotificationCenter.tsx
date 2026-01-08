import { useState } from 'react'
import Link from 'next/link'
import { Notification } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface NotificationCenterProps {
 notifications: Notification[]
 unreadCount: number
 onMarkAsRead: (id: string) => void
 onMarkAllAsRead: () => void
 loading?: boolean
}

export function NotificationCenter({
 notifications,
 unreadCount,
 onMarkAsRead,
 onMarkAllAsRead,
 loading
}: NotificationCenterProps) {
 const [isOpen, setIsOpen] = useState(false)

 const formatTime = (timestamp: string) => {
 const date = new Date(timestamp)
 const now = new Date()
 const diffMs = now.getTime() - date.getTime()
 const diffMins = Math.floor(diffMs / 60000)
 const diffHours = Math.floor(diffMs / 3600000)
 const diffDays = Math.floor(diffMs / 86400000)

 if (diffMins < 1) return 'just now'
 if (diffMins < 60) return `${diffMins}m ago`
 if (diffHours < 24) return `${diffHours}h ago`
 if (diffDays < 7) return `${diffDays}d ago`
 
 return date.toLocaleDateString()
 }

 return (
 <div className="relative">
 {/* Bell Icon Button */}
 <button
 onClick={() => setIsOpen(!isOpen)}
 className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
 title="Notifications"
 >
 <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
 </svg>
 {unreadCount > 0 && (
 <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
 {unreadCount > 9 ? '9+' : unreadCount}
 </span>
 )}
 </button>

 {/* Notification Dropdown */}
 {isOpen && (
 <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
 {/* Header */}
 <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
 <h3 className="font-semibold text-gray-900">Notifications</h3>
 <button
 onClick={() => setIsOpen(false)}
 className="text-gray-400 hover:text-gray-600"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* Notifications List */}
 {loading ? (
 <div className="p-4 text-center text-gray-500">Loading...</div>
 ) : notifications.length === 0 ? (
 <div className="p-8 text-center text-gray-500">
 <div className="w-12 h-12 mx-auto mb-2 opacity-20">
 <svg fill="currentColor" viewBox="0 0 24 24">
 <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
 </svg>
 </div>
 <p>No notifications</p>
 </div>
 ) : (
 <>
 {unreadCount > 0 && (
 <button
 onClick={onMarkAllAsRead}
 className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-b border-gray-100 transition-colors"
 >
 Mark all as read
 </button>
 )}

 <div className="divide-y divide-gray-100">
 {notifications.map((notification) => (
 <Link
 key={notification.id}
 href={notification.action_url || '#'}
 onClick={() => {
 if (!notification.is_read) {
 onMarkAsRead(notification.id)
 }
 setIsOpen(false)
 }}
 >
 <div
 className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
 !notification.is_read ? 'bg-blue-50' : ''
 }`}
 >
 <div className="flex gap-3">
 {/* Icon */}
 <div className="flex-shrink-0">
 {notification.notification_type === 'contract_signed' && (
 <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
 <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
 </svg>
 </div>
 )}
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <p
 className={`text-sm font-semibold ${
 !notification.is_read
 ? 'text-gray-900'
 : 'text-gray-700'
 }`}
 >
 {notification.title}
 </p>
 {!notification.is_read && (
 <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
 )}
 </div>

 <p className="text-sm text-gray-600 mt-1">
 {notification.message}
 </p>

 <p className="text-xs text-gray-500 mt-2">
 {formatTime(notification.created_at)}
 </p>
 </div>
 </div>
 </div>
 </Link>
 ))}
 </div>
 </>
 )}
 </div>
 )}

 {/* Backdrop */}
 {isOpen && (
 <div
 className="fixed inset-0 z-40"
 onClick={() => setIsOpen(false)}
 />
 )}
 </div>
 )
}
