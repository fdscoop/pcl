import { Skeleton } from '@/components/ui/skeleton'

export default function ConversationSkeleton() {
 return (
 <div className="space-y-4">
 {/* Incoming message skeleton */}
 <div className="flex items-start gap-3">
 <Skeleton className="h-9 w-9 rounded-full flex-shrink-0 bg-slate-200" />
 <div className="flex-1 space-y-2">
 <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gradient-to-br from-sky-100/40 to-sky-50/20 shadow-md">
 <div className="flex items-center justify-between mb-2 rounded-md px-2 py-1 bg-sky-50/30">
 <Skeleton className="h-4 w-20 bg-sky-200" />
 <Skeleton className="h-3 w-24 bg-sky-200" />
 </div>
 <Skeleton className="h-16 w-full bg-sky-200/50 rounded-md" />
 </div>
 </div>
 </div>

 {/* Outgoing message skeleton */}
 <div className="flex items-start gap-3 justify-end flex-row-reverse">
 <Skeleton className="h-9 w-9 rounded-full flex-shrink-0 bg-slate-200" />
 <div className="flex-1 space-y-2 flex flex-col items-end">
 <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gradient-to-br from-amber-100/50 to-amber-50/30 shadow-md">
 <div className="flex items-center justify-between mb-2 rounded-md px-2 py-1 bg-amber-50/30">
 <Skeleton className="h-4 w-12 bg-amber-200" />
 <Skeleton className="h-3 w-24 bg-amber-200" />
 </div>
 <Skeleton className="h-12 w-full bg-amber-200/50 rounded-md" />
 </div>
 </div>
 </div>

 {/* Incoming message skeleton */}
 <div className="flex items-start gap-3">
 <Skeleton className="h-9 w-9 rounded-full flex-shrink-0 bg-slate-200" />
 <div className="flex-1 space-y-2">
 <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gradient-to-br from-sky-100/40 to-sky-50/20 shadow-md">
 <div className="flex items-center justify-between mb-2 rounded-md px-2 py-1 bg-sky-50/30">
 <Skeleton className="h-4 w-20 bg-sky-200" />
 <Skeleton className="h-3 w-24 bg-sky-200" />
 </div>
 <Skeleton className="h-20 w-full bg-sky-200/50 rounded-md" />
 </div>
 </div>
 </div>

 {/* Reply form skeleton */}
 <div className="space-y-3 pt-4 border-t border-slate-200">
 <Skeleton className="h-4 w-16 bg-slate-200" />
 <Skeleton className="h-32 w-full rounded-lg bg-slate-200" />
 <Skeleton className="h-10 w-32 rounded-md bg-gradient-to-r from-teal-200 to-teal-300" />
 </div>
 </div>
 )
}
