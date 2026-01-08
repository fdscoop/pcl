import { AlertCircle } from 'lucide-react'

interface BetaNoticeProps {
 className?: string
 size?: 'sm' | 'md' | 'lg'
}

export default function BetaNotice({ className = '', size = 'md' }: BetaNoticeProps) {
 const sizeClasses = {
 sm: 'p-3 text-xs',
 md: 'p-4 text-sm',
 lg: 'p-6 text-base',
 }

 return (
 <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl ${sizeClasses[size]} ${className}`}>
 <div className="flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-bold text-amber-900 mb-1">
 Beta Testing Mode
 </p>
 <p className="text-amber-800 leading-relaxed">
 PCL Championship is currently in beta testing. We are not accepting player or club registrations at this time.
 Official launch coming soon! For early access inquiries, please contact our support team.
 </p>
 </div>
 </div>
 </div>
 )
}
