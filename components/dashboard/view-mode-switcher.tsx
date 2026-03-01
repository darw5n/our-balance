import Link from "next/link"

type ViewMode = "personal" | "family"

type ViewModeSwitcherProps = {
  currentView: string
  basePath?: string
  extraParams?: Record<string, string>
}

const views: { value: ViewMode; label: string }[] = [
  { value: "personal", label: "Personale" },
  { value: "family", label: "In comune" },
]

export function ViewModeSwitcher({ currentView, basePath = "/dashboard", extraParams }: ViewModeSwitcherProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-white/10 bg-zinc-900/50 p-1">
      {views.map(({ value, label }) => {
        const params = new URLSearchParams({ view: value, ...extraParams })
        return (
          <Link
            key={value}
            href={`${basePath}?${params.toString()}`}
            prefetch
            replace
            scroll={false}
            className={`flex-1 rounded-md px-2.5 py-1 text-center text-xs font-medium transition-colors ${
              currentView === value
                ? "bg-zinc-700 text-zinc-50"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
