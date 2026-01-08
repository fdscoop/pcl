'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ScoutPlayersRedirect() {
 const router = useRouter()

 useEffect(() => {
 // Redirect to the new location within the dashboard
 router.replace('/dashboard/club-owner/scout-players')
 }, [router])

 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-blue-50 to-purple-100">
 <div className="text-center">
 <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
 <p className="mt-4 text-gray-600">Redirecting to Scout Players...</p>
 </div>
 </div>
 )
}
