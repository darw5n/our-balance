import { Card } from "@/components/ui/card"

function SkeletonCard() {
  return (
    <Card className="border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-8 w-32 rounded bg-white/10" />
        </div>
        <div className="h-9 w-9 rounded-md border border-white/10 bg-zinc-950/30" />
      </div>
    </Card>
  )
}

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="h-8 w-32 rounded bg-white/10" />
        <div className="h-4 w-48 rounded bg-white/10" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <Card className="h-72 border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
          <div className="mb-4 space-y-2">
            <div className="h-4 w-40 rounded bg-white/10" />
            <div className="h-3 w-56 rounded bg-white/10" />
          </div>
          <div className="h-full rounded-lg bg-white/5" />
        </Card>

        <Card className="h-72 border-white/10 bg-zinc-900/50 p-5 text-zinc-50 shadow-sm backdrop-blur">
          <div className="mb-4 space-y-2">
            <div className="h-4 w-40 rounded bg-white/10" />
            <div className="h-3 w-56 rounded bg-white/10" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-white/5" />
            <div className="h-3 w-11/12 rounded bg-white/5" />
            <div className="h-3 w-10/12 rounded bg-white/5" />
            <div className="h-3 w-9/12 rounded bg-white/5" />
          </div>
        </Card>
      </div>
    </div>
  )
}

