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
    <div className="flex bg-surface-2 border border-border-subtle rounded-[14px] p-[3px]">
      {views.map(({ value, label }) => {
        const params = new URLSearchParams({ view: value, ...extraParams })
        return (
          <Link
            key={value}
            href={`${basePath}?${params.toString()}`}
            prefetch
            replace
            scroll={false}
            className={
              currentView === value
                ? "flex-1 text-center py-2 rounded-full font-sans text-sm font-medium bg-surface-1 text-text-1 shadow-sm transition-all duration-200 ease-out"
                : "flex-1 text-center py-2 rounded-[10px] font-sans text-sm font-medium bg-transparent text-text-3 hover:text-text-2 transition-all duration-200 ease-out"
            }
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
