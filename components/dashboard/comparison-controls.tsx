"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { CategoryCombobox } from "@/components/dashboard/category-combobox"
import { ViewModeSwitcher } from "@/components/dashboard/view-mode-switcher"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"

type Props = {
  categories: CategoryOption[]
  cat: string
  y1: number
  y2: number
  viewMode: string
  availableYears: number[]
}

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-md border border-border-subtle bg-surface-0 pl-3 pr-9 text-sm text-text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"

/**
 * Controlli del confronto: categoria + due anni + vista personale/comune.
 * Ogni cambio aggiorna i searchParams dell'URL (stato server-first, condivisibile).
 */
export function ComparisonControls({ categories, cat, y1, y2, viewMode, availableYears }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "confronto")
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const viewExtraParams: Record<string, string> = {
    tab: "confronto",
    y1: String(y1),
    y2: String(y2),
  }
  if (cat) viewExtraParams.cat = cat

  return (
    <div className="space-y-3">
      <ViewModeSwitcher currentView={viewMode} basePath="/transactions" extraParams={viewExtraParams} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Categoria */}
        <div className="min-w-0 flex-1">
          <label className="mb-1.5 block font-sans text-xs font-medium text-text-2">Categoria</label>
          <CategoryCombobox
            categories={categories}
            txType="expense"
            value={cat}
            onChange={(id) => updateParam("cat", id)}
          />
        </div>

        {/* Anni da confrontare */}
        <div className="flex items-end gap-2 sm:w-[280px]">
          <div className="flex-1">
            <label htmlFor="cmp-y1" className="mb-1.5 block font-sans text-xs font-medium text-text-2">
              Anno
            </label>
            <div className="relative">
              <select
                id="cmp-y1"
                value={String(y1)}
                onChange={(e) => updateParam("y1", e.target.value)}
                className={SELECT_CLASS}
                aria-label="Primo anno da confrontare"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            </div>
          </div>

          <span className="pb-2.5 font-sans text-sm text-text-3">vs</span>

          <div className="flex-1">
            <label htmlFor="cmp-y2" className="mb-1.5 block font-sans text-xs font-medium text-text-2">
              Confronta con
            </label>
            <div className="relative">
              <select
                id="cmp-y2"
                value={String(y2)}
                onChange={(e) => updateParam("y2", e.target.value)}
                className={SELECT_CLASS}
                aria-label="Secondo anno da confrontare"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
