'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function TestMatchPage() {
 const params = useParams()
 const router = useRouter()
 const matchId = params.id as string

 return (
 <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
 <Card className="max-w-md mx-auto text-center p-8 shadow-xl">
 <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
 <CardHeader>
 <CardTitle className="text-2xl font-bold text-green-800 ">
 Navigation Successful! 🎉
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="bg-green-50 p-4 rounded-lg border border-green-200 ">
 <p className="text-green-700 font-semibold">
 Match ID: <span className="font-mono">{matchId}</span>
 </p>
 </div>
 <p className="text-slate-600 ">
 The match details page navigation is working correctly! The actual match data will be loaded for real match IDs.
 </p>
 <Button 
 onClick={() => router.back()} 
 variant="outline" 
 className="w-full"
 >
 <ArrowLeft className="w-4 h-4 mr-2" />
 Go Back to Dashboard
 </Button>
 </CardContent>
 </Card>
 </div>
 )
}