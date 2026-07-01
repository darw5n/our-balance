export default function CategoriesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton h-7 w-36 !rounded-lg" />
        <div className="skeleton h-3 w-80" />
      </div>

      {/* Category rows */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-1 px-4 py-3">
            <div className="skeleton h-9 w-9 !rounded-lg" />
            <div className="skeleton h-4 flex-1 max-w-[180px]" />
            <div className="skeleton h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
