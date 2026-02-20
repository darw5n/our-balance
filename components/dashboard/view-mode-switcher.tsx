"use client"

import { useRouter } from "next/navigation"

type ViewMode = "personal" | "family" | "both"

type ViewModeSwitcherProps = {
  currentView: string
  basePath?: string
  extraParams?: Record<string, string>
}

const views: { value: ViewMode; label: string }[] = [
  { value: "personal", label: "Personale" },
  { value: "family", label: "In comune" },
  { value: "both", label: "Entrambi" },
]

export function ViewModeSwitcher({ currentView, basePath = "/dashboard", extraParams }: ViewModeSwitcherProps) {
  const router = useRouter()

  function handleClick(view: ViewMode) {
    const params = new URLSearchParams({ view, ...extraParams })
    router.replace(`${basePath}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex gap-1 rounded-lg border border-white/10 bg-zinc-900/50 p-1">
      {views.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value)}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            currentView === value
              ? "bg-zinc-700 text-zinc-50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
