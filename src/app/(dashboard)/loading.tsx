import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 bg-[#E6DCC0]/60" />
        <Skeleton className="h-4 w-80 max-w-full bg-[#E6DCC0]/40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-28 rounded-xl border border-[#E6DCC0] bg-white"
          />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl border border-[#E6DCC0] bg-white" />
    </div>
  )
}
