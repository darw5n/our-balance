export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton h-8 w-8 !rounded-lg" />
          <div className="space-y-2">
            <div className="skeleton h-8 w-32 !rounded-lg" />
            <div className="skeleton h-3 w-52" />
          </div>
          <div className="skeleton h-8 w-8 !rounded-lg" />
        </div>
        <div className="skeleton h-8 w-48 !rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 space-y-3">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-7 w-28" />
          </div>
        ))}
      </div>

      <div className="skeleton h-72 w-full !rounded-xl" />
      <div className="skeleton h-48 w-full !rounded-xl" />
      <div className="skeleton h-48 w-full !rounded-xl" />
    </div>
  )
}
