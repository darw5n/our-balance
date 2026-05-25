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
    <div className="flex w-full rounded-[14px] border border-border-subtle bg-surface-2 p-[3px]">
      {views.map(({ value, label }) => {
        const active = currentView === value
        const params = new URLSearchParams({ view: value, ...extraParams })
        return (
          <Link
            key={value}
            href={`${basePath}?${params.toString()}`}
            prefetch
            replace
            scroll={false}
            className={`flex flex-1 items-center justify-center whitespace-nowrap px-3 py-2 font-sans text-sm font-medium transition-all duration-200 ease-out ${
              active
                ? "rounded-full bg-surface-1 text-text-1 shadow-sm"
                : "rounded-[10px] bg-transparent text-text-3 hover:text-text-2"
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
