'use client'

import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
 type?: 'no-results' | 'error' | 'success' | 'info'
 title: string
 description?: string
 action?: {
 label: string
 onClick: () => void
 }
 className?: string
}

const iconMap = {
 'no-results': AlertCircle,
 'error': XCircle,
 'success': CheckCircle,
 'info': Info,
}

const colorMap = {
 'no-results': 'text-muted-foreground',
 'error': 'text-destructive',
 'success': 'text-success',
 'info': 'text-primary',
}

export default function EmptyState({
 type = 'no-results',
 title,
 description,
 action,
 className = ""
}: EmptyStateProps) {
 const Icon = iconMap[type]

 return (
 <Card className={`text-center py-12 ${className}`}>
 <CardContent className="space-y-4">
 <div className="flex justify-center">
 <Icon className={`h-16 w-16 ${colorMap[type]}`} />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
 {description && (
 <p className="text-sm text-muted-foreground max-w-md mx-auto">
 {description}
 </p>
 )}
 </div>
 {action && (
 <div className="pt-4">
 <Button onClick={action.onClick} variant="outline">
 {action.label}
 </Button>
 </div>
 )}
 </CardContent>
 </Card>
 )
}