export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton h-7 w-40 !rounded-lg" />
        <div className="skeleton h-3 w-64" />
      </div>

      {/* Token manager box */}
      <div className="rounded-xl border border-border-subtle bg-surface-1/50 p-5 space-y-4">
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-3 w-full max-w-lg" />
        <div className="skeleton h-10 w-full !rounded-lg" />
        <div className="skeleton h-9 w-40 !rounded-lg" />
      </div>
    </div>
  )
}
