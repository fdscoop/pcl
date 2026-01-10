import { useState } from 'react'
import Link from 'next/link'
import { Notification } from '@/types/database'

interface NotificationCenterProps {
 notifications: Notification[]
 unreadCount: number
 onMarkAsRead: (id: string) => void
 onMarkAllAsRead: () => void
 loading?: boolean
 theme?: 'light' | 'dark'
 accentColor?: 'teal' | 'orange' | 'blue' | 'purple' | 'green'
}

export function NotificationCenter({
 notifications,
 unreadCount,
 onMarkAsRead,
 onMarkAllAsRead,
 loading,
 theme = 'light',
 accentColor = 'teal'
}: NotificationCenterProps) {
 const [isOpen, setIsOpen] = useState(false)

 // Theme-based color classes
 const colors = {
   teal: {
     bg: theme === 'light' ? 'bg-slate-100' : 'bg-slate-800',
     hover: theme === 'light' ? 'hover:bg-slate-200' : 'hover:bg-slate-700',
     text: theme === 'light' ? 'text-slate-600' : 'text-slate-300',
     headerBg: 'bg-gradient-to-r from-teal-500 to-cyan-500',
     unreadBg: theme === 'light' ? 'bg-teal-50/50' : 'bg-teal-900/20',
     badge: 'bg-teal-500',
     border: theme === 'light' ? 'border-teal-100' : 'border-teal-800'
   },
   orange: {
     bg: theme === 'light' ? 'bg-slate-100' : 'bg-slate-800',
     hover: theme === 'light' ? 'hover:bg-slate-200' : 'hover:bg-slate-700',
     text: theme === 'light' ? 'text-slate-600' : 'text-slate-300',
     headerBg: 'bg-gradient-to-r from-orange-500 to-amber-500',
     unreadBg: theme === 'light' ? 'bg-orange-50/50' : 'bg-orange-900/20',
     badge: 'bg-orange-500',
     border: theme === 'light' ? 'border-orange-100' : 'border-orange-800'
   },
   blue: {
     bg: theme === 'light' ? 'bg-slate-100' : 'bg-slate-800',
     hover: theme === 'light' ? 'hover:bg-slate-200' : 'hover:bg-slate-700',
     text: theme === 'light' ? 'text-slate-600' : 'text-slate-300',
     headerBg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
     unreadBg: theme === 'light' ? 'bg-blue-50/50' : 'bg-blue-900/20',
     badge: 'bg-blue-500',
     border: theme === 'light' ? 'border-blue-100' : 'border-blue-800'
   },
   purple: {
     bg: theme === 'light' ? 'bg-slate-100' : 'bg-slate-800',
     hover: theme === 'light' ? 'hover:bg-slate-200' : 'hover:bg-slate-700',
     text: theme === 'light' ? 'text-slate-600' : 'text-slate-300',
     headerBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
     unreadBg: theme === 'light' ? 'bg-purple-50/50' : 'bg-purple-900/20',
     badge: 'bg-purple-500',
     border: theme === 'light' ? 'border-purple-100' : 'border-purple-800'
   },
   green: {
     bg: theme === 'light' ? 'bg-slate-100' : 'bg-slate-800',
     hover: theme === 'light' ? 'hover:bg-slate-200' : 'hover:bg-slate-700',
     text: theme === 'light' ? 'text-slate-600' : 'text-slate-300',
     headerBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
     unreadBg: theme === 'light' ? 'bg-green-50/50' : 'bg-green-900/20',
     badge: 'bg-green-500',
     border: theme === 'light' ? 'border-green-100' : 'border-green-800'
   }
 }

 const currentColors = colors[accentColor]

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

 // Check if notification is read based on available read flags
 const isNotificationRead = (notification: Notification) => {
   return notification.read_by_player || 
          notification.read_by_club || 
          notification.read_by_referee || 
          notification.read_by_staff || 
          notification.read_by_stadium_owner ||
          notification.is_read
 }

 return (
 <div className="relative">
 {/* Bell Icon Button */}
 <button
 onClick={() => setIsOpen(!isOpen)}
 className={`relative p-2 rounded-xl ${currentColors.bg} ${currentColors.hover} transition-colors`}
 title="Notifications"
 aria-label="Notifications"
 >
 <svg className={`w-5 h-5 ${currentColors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
 </svg>
 {unreadCount > 0 && (
 <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold leading-none text-white ${currentColors.badge} rounded-full animate-pulse`}>
 {unreadCount > 9 ? '9+' : unreadCount}
 </span>
 )}
 </button>

 {/* Notification Dropdown */}
 {isOpen && (
 <div className={`absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md ${theme === 'light' ? 'bg-white' : 'bg-slate-900'} rounded-xl shadow-2xl border-2 ${currentColors.border} z-[100] max-h-[70vh] sm:max-h-96 overflow-hidden flex flex-col`}>
 {/* Header */}
 <div className={`sticky top-0 ${currentColors.headerBg} p-3 sm:p-4 flex items-center justify-between border-b-2 ${currentColors.border}`}>
 <h3 className="font-bold text-white flex items-center gap-2">
 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
 <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
 </svg>
 <span>Notifications</span>
 {unreadCount > 0 && (
 <span className="px-2 py-0.5 text-xs font-bold bg-white/20 text-white rounded-full">
 {unreadCount}
 </span>
 )}
 </h3>
 <button
 onClick={() => setIsOpen(false)}
 className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
 aria-label="Close notifications"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* Notifications List - Scrollable */}
 <div className="flex-1 overflow-y-auto">
 {loading ? (
 <div className={`p-8 text-center ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
 <div className={`inline-block w-8 h-8 border-4 ${theme === 'light' ? 'border-teal-200 border-t-teal-500' : 'border-slate-700 border-t-slate-400'} rounded-full animate-spin`}></div>
 <p className="mt-2">Loading...</p>
 </div>
 ) : notifications.length === 0 ? (
 <div className={`p-8 text-center ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
 <div className="w-16 h-16 mx-auto mb-3 opacity-20">
 <svg fill="currentColor" viewBox="0 0 24 24">
 <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
 </svg>
 </div>
 <p className="font-medium">No notifications</p>
 <p className="text-xs mt-1">You're all caught up!</p>
 </div>
 ) : (
 <>
 {unreadCount > 0 && (
 <button
 onClick={onMarkAllAsRead}
 className={`w-full px-4 py-2.5 text-sm font-medium ${accentColor === 'teal' ? 'text-teal-600 hover:bg-teal-50' : accentColor === 'orange' ? 'text-orange-600 hover:bg-orange-50' : 'text-blue-600 hover:bg-blue-50'} ${theme === 'light' ? 'border-b border-slate-100' : 'border-b border-slate-800'} transition-colors text-left`}
 >
 ✓ Mark all as read
 </button>
 )}

 <div className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-slate-800'}`}>
 {notifications.map((notification) => {
 const isRead = isNotificationRead(notification)
 return (
 <Link
 key={notification.id}
 href={notification.action_url || '#'}
 onClick={() => {
 if (!isRead) {
 onMarkAsRead(notification.id)
 }
 setIsOpen(false)
 }}
 >
 <div
 className={`p-3 sm:p-4 ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800'} transition-colors cursor-pointer ${
 !isRead ? currentColors.unreadBg : ''
 }`}
 >
 <div className="flex gap-2 sm:gap-3">
 {/* Icon */}
 <div className="flex-shrink-0">
 {notification.notification_type === 'contract_signed' && (
 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
 <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
 </svg>
 </div>
 )}
 {notification.notification_type === 'contract_created' && (
 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
 <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
 </svg>
 </div>
 )}
 {notification.notification_type === 'match_assigned' && (
 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center">
 <svg className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
 <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
 </svg>
 </div>
 )}
 {!['contract_signed', 'contract_created', 'match_assigned'].includes(notification.notification_type) && (
 <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-700'} flex items-center justify-center`}>
 <svg className={`w-4 h-4 sm:w-6 sm:h-6 ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
 <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
 </svg>
 </div>
 )}
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <p
 className={`text-xs sm:text-sm font-semibold ${
 !isRead
 ? theme === 'light' ? 'text-slate-900' : 'text-white'
 : theme === 'light' ? 'text-slate-700' : 'text-slate-400'
 }`}
 >
 {notification.title}
 </p>
 {!isRead && (
 <span className={`flex-shrink-0 w-2 h-2 rounded-full ${currentColors.badge} mt-1`} />
 )}
 </div>

 <p className={`text-xs sm:text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'} mt-1 line-clamp-2`}>
 {notification.message}
 </p>

 <p className={`text-[10px] sm:text-xs ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'} mt-1.5 sm:mt-2`}>
 {formatTime(notification.created_at)}
 </p>
 </div>
 </div>
 </div>
 </Link>
 )
 })}
 </div>
 </>
 )}
 </div>
 </div>
 )}

 {/* Backdrop */}
 {isOpen && (
 <div
 className="fixed inset-0 z-[90]"
 onClick={() => setIsOpen(false)}
 />
 )}
 </div>
 )
}
