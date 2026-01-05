import { Skeleton } from '@/components/ui/skeleton'

export default function ThreadItemSkeleton() {
  return (
    <div className="w-full rounded-2xl px-3 py-2 border border-slate-200 bg-gradient-to-r from-sky-50/30 to-blue-50/20 my-2 shadow-sm">
      <div className="h-0.5 w-full rounded-t-2xl bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse" />
      <div className="flex items-center justify-between gap-3 mt-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full bg-slate-200" />
          <Skeleton className="h-4 w-32 bg-slate-200" />
        </div>
      </div>
      <div className="mt-2 flex items-start justify-between">
        <div className="flex-1 pr-3" />
        <div className="text-right space-y-2">
          <Skeleton className="h-3 w-40 ml-auto bg-slate-200" />
          <Skeleton className="h-3 w-24 ml-auto bg-slate-200" />
        </div>
      </div>
    </div>
  )
}
