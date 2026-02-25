import { Card } from "@/components/ui/card"

function SkeletonCard() {
  return (
    <Card className="border-white/10 bg-zinc-900/50 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-7 w-32" />
        </div>
        <div className="skeleton h-9 w-9 !rounded-md" />
      </div>
    </Card>
  )
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-4 w-48" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <Card className="border-white/10 bg-zinc-900/50 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 space-y-2">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-56" />
          </div>
          <div className="skeleton h-48 w-full !rounded-lg" />
        </Card>

        <Card className="border-white/10 bg-zinc-900/50 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 space-y-2">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-56" />
          </div>
          <div className="space-y-2.5">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-11/12" />
            <div className="skeleton h-3 w-10/12" />
            <div className="skeleton h-3 w-9/12" />
            <div className="skeleton h-3 w-8/12" />
          </div>
        </Card>
      </div>
    </div>
  )
}
