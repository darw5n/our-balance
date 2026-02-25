export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="skeleton h-8 w-40 !rounded-lg" />
          <div className="skeleton h-3 w-72" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-24 !rounded-md" />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border border-white/5 bg-zinc-900/50 px-4 py-3">
            <div className="skeleton h-4 w-4" />
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-3 flex-1" />
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}
