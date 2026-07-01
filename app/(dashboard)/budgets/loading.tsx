export default function BudgetsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton h-7 w-32 !rounded-lg" />
        <div className="skeleton h-3 w-80" />
      </div>

      {/* View mode switcher */}
      <div className="skeleton h-9 w-44 !rounded-full" />

      {/* Budget cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border-subtle bg-surface-1 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-4 w-20" />
            </div>
            <div className="skeleton h-2.5 w-full !rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
