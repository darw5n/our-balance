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
    <div className="flex gap-1 rounded-lg border border-border-subtle bg-surface-2 p-1">
      {views.map(({ value, label }) => {
        const params = new URLSearchParams({ view: value, ...extraParams })
        return (
          <Link
            key={value}
            href={`${basePath}?${params.toString()}`}
            prefetch
            replace
            scroll={false}
            className={`flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              currentView === value
                ? "bg-surface-active text-foreground"
                : "text-text-2 hover:text-text-1"
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
