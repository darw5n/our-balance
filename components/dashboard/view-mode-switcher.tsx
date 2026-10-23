import { SegmentedLinks } from "@/components/dashboard/segmented-links"

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
  const segments = views.map(({ value, label }) => ({
    value,
    label,
    href: `${basePath}?${new URLSearchParams({ view: value, ...extraParams }).toString()}`,
  }))

  return <SegmentedLinks segments={segments} active={currentView} replace />
}
