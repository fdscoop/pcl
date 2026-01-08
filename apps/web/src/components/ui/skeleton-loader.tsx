'use client'

import { Card, CardContent } from '@/components/ui/card'

interface SkeletonLoaderProps {
 type?: 'card' | 'list' | 'profile' | 'stats'
 count?: number
 className?: string
}

const SkeletonCard = () => (
 <Card className="animate-pulse">
 <CardContent className="p-6">
 <div className="flex items-center space-x-4">
 <div className="rounded-full bg-muted h-12 w-12"></div>
 <div className="flex-1 space-y-2">
 <div className="h-4 bg-muted rounded w-3/4"></div>
 <div className="h-3 bg-muted rounded w-1/2"></div>
 </div>
 </div>
 <div className="space-y-3 mt-4">
 <div className="h-3 bg-muted rounded"></div>
 <div className="h-3 bg-muted rounded w-5/6"></div>
 <div className="h-3 bg-muted rounded w-4/6"></div>
 </div>
 </CardContent>
 </Card>
)

const SkeletonList = () => (
 <div className="space-y-4">
 {Array.from({ length: 5 }).map((_, i) => (
 <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
 <div className="rounded-full bg-muted h-10 w-10"></div>
 <div className="flex-1 space-y-2">
 <div className="h-4 bg-muted rounded w-1/3"></div>
 <div className="h-3 bg-muted rounded w-1/2"></div>
 </div>
 <div className="h-8 bg-muted rounded w-20"></div>
 </div>
 ))}
 </div>
)

const SkeletonProfile = () => (
 <div className="animate-pulse">
 <div className="flex items-center space-x-6 mb-8">
 <div className="rounded-full bg-muted h-24 w-24"></div>
 <div className="flex-1 space-y-3">
 <div className="h-6 bg-muted rounded w-1/3"></div>
 <div className="h-4 bg-muted rounded w-1/4"></div>
 <div className="h-4 bg-muted rounded w-1/2"></div>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="h-32 bg-muted rounded-lg"></div>
 ))}
 </div>
 </div>
)

const SkeletonStats = () => (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {Array.from({ length: 4 }).map((_, i) => (
 <Card key={i} className="animate-pulse">
 <CardContent className="p-6">
 <div className="flex items-center justify-between mb-2">
 <div className="h-4 bg-muted rounded w-1/2"></div>
 <div className="h-4 w-4 bg-muted rounded"></div>
 </div>
 <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
 <div className="h-3 bg-muted rounded w-1/3"></div>
 </CardContent>
 </Card>
 ))}
 </div>
)

export default function SkeletonLoader({ 
 type = 'card', 
 count = 1, 
 className = "" 
}: SkeletonLoaderProps) {
 const renderSkeleton = () => {
 switch (type) {
 case 'list':
 return <SkeletonList />
 case 'profile':
 return <SkeletonProfile />
 case 'stats':
 return <SkeletonStats />
 case 'card':
 default:
 return (
 <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
 {Array.from({ length: count }).map((_, i) => (
 <SkeletonCard key={i} />
 ))}
 </div>
 )
 }
 }

 return <div className={className}>{renderSkeleton()}</div>
}