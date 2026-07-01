export default function RecurringLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton h-7 w-40 !rounded-lg" />
        <div className="skeleton h-3 w-64" />
      </div>

      {/* Recurring rows */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-1 px-4 py-3">
            <div className="skeleton h-9 w-9 !rounded-lg" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-3 w-24" />
            </div>
            <div className="skeleton h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Savings goals card */}
      <div className="rounded-xl border border-border-subtle bg-surface-1 p-5 space-y-4">
        <div className="skeleton h-5 w-52" />
        <div className="skeleton h-3 w-full max-w-md mx-auto" />
      </div>
    </div>
  )
}
