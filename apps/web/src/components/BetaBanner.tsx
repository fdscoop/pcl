'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, Info } from 'lucide-react'
import Image from 'next/image'

export default function BetaBanner() {
 const [isVisible, setIsVisible] = useState(false)

 useEffect(() => {
 // Check if user has dismissed the banner
 const dismissed = localStorage.getItem('beta-banner-dismissed')
 if (!dismissed) {
 setIsVisible(true)
 }
 }, [])

 const handleDismiss = () => {
 setIsVisible(false)
 localStorage.setItem('beta-banner-dismissed', 'true')
 }

 if (!isVisible) return null

 return (
 <div className="relative bg-gradient-to-r from-[#1e3a8a] via-[#1e3a8a]/95 to-[#f97316]/90 border-b-4 border-[#f97316] shadow-lg">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-4 flex-1">
 {/* PCL Logo */}
 <div className="hidden sm:block flex-shrink-0">
 <Image
 src="/logo.png"
 alt="PCL"
 width={50}
 height={50}
 className="object-contain"
 />
 </div>

 {/* Icon for mobile */}
 <div className="sm:hidden flex-shrink-0">
 <div className="p-2 bg-white/10 rounded-full">
 <Info className="w-5 h-5 text-white" />
 </div>
 </div>

 {/* Message */}
 <div className="flex-1">
 <div className="flex items-start sm:items-center gap-2">
 <AlertCircle className="w-5 h-5 text-[#f97316] flex-shrink-0 mt-0.5 sm:mt-0" />
 <div>
 <p className="text-white font-semibold text-sm sm:text-base">
 Beta Testing Mode
 </p>
 <p className="text-white/90 text-xs sm:text-sm mt-1">
 PCL Championship is currently in beta. We are not accepting player or club registrations at this time.
 Official launch coming soon! <span className="hidden sm:inline">Stay tuned for updates.</span>
 </p>
 </div>
 </div>
 </div>

 {/* Close Button */}
 <button
 onClick={handleDismiss}
 className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors group"
 aria-label="Dismiss banner"
 >
 <X className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
 </button>
 </div>
 </div>
 </div>

 {/* Animated gradient line */}
 <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f97316] via-white to-[#f97316] opacity-50 animate-pulse"></div>
 </div>
 )
}
